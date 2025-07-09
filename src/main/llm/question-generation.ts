import { MODELS } from '../../constants/misc';
import { GenerateQuestionOptions } from '../../constants/types';
import { EmbeddingsHelper } from '../database/embeddings-helper';
import DatabaseService from '../database/services';
import { renderLog } from '../util';
import LLMService from './services';
import { generatePromptAndSchema } from './prompts';
import { zodToJsonSchema } from 'zod-to-json-schema';

export async function generateQuestions(
  subjectId: string,
  options: GenerateQuestionOptions,
) {
  const limit = 1000; // 1 million just to get all results
  try {
    const subject = await DatabaseService.getSubject(subjectId);
    if (subject == null) {
      return { success: false, error: 'Subject not found', data: null };
    }

    const embeddings = await createEmbeddings(subject.name);
    if (embeddings == null) {
      return { success: false, error: 'Embedding not found', data: null };
    }

    const relevantChunks = EmbeddingsHelper.searchSimilar(
      embeddings[0],
      limit,
      subjectId,
    );

    renderLog('Found relevant chunks:', relevantChunks);

    // If no chunks found, use a fallback
    const chunksToUse =
      relevantChunks.length > 0
        ? relevantChunks.map((chunk) => chunk.text)
        : [`Information about ${subject.name}`];

    const questions = await generateQuestionsFromChunks(
      subject.name,
      options,
      chunksToUse,
    );

    // Ensure we always return an array
    const questionsArray = Array.isArray(questions) ? questions : [questions];

    return {
      success: true,
      data: questionsArray || [
        {
          question: 'What is the capital of France?',
          choices: ['Paris', 'London', 'Berlin', 'Madrid'],
          answer: 0,
        },
      ],
    };
  } catch (error) {
    console.log('Error in generateQuestions:', error);
    renderLog('Error in generateQuestions:', error);
    return { success: false, error: error, data: null };
  }
}

async function generateQuestionsFromChunks(
  subjectName: string,
  options: GenerateQuestionOptions,
  chunks: string[],
) {
  try {
    const { prompt, zodSchema } = generatePromptAndSchema(
      subjectName,
      options,
      chunks,
    );

    renderLog('Generating questions with prompt:', prompt);
    renderLog('Zod Schema being used:', zodSchema);

    // Use Ollama structured output with proper format parameter
    let response = await LLMService.generate({
      model: MODELS.GEMMA_3_12B_IT_QAT,
      prompt: prompt,
      stream: false,
      format: zodToJsonSchema(zodSchema),
    });

    // If structured output fails, try regular output
    if (!response.success || !response.response) {
      renderLog('Structured output failed, trying regular output...');

      response = await LLMService.generate({
        model: MODELS.GEMMA_3N_E4B_IT_FP16,
        prompt: prompt,
        stream: false,
      });
    }

    if (response.success && response.response) {
      try {
        let questions;

        if (typeof response.response === 'string') {
          // Try to parse as JSON
          try {
            questions = JSON.parse(response.response);
          } catch (parseError) {
            renderLog(
              'Failed to parse as JSON, treating as plain text:',
              parseError,
            );
            // If parsing fails, create a simple question from the response
            questions = [
              {
                question: response.response.substring(0, 200) + '...',
                choices: [],
                answer: null,
              },
            ];
          }
        } else {
          questions = response.response;
        }

        // Ensure we always return an array
        let questionsArray;
        if (Array.isArray(questions)) {
          questionsArray = questions;
        } else if (questions && typeof questions === 'object') {
          // If it's a single question object, wrap it in an array
          renderLog('Single question object detected, wrapping in array');
          questionsArray = [questions];
        } else {
          // If it's not an array or object, create a fallback
          renderLog('Invalid questions format, creating fallback');
          questionsArray = [
            {
              question: 'Question generated from your content',
              choices: ['Option A', 'Option B', 'Option C', 'Option D'],
              answer: 0,
            },
          ];
        }

        // Validate the number of questions
        renderLog(
          `Generated ${questionsArray.length} questions, requested ${options.count}`,
        );
        if (questionsArray.length !== options.count) {
          renderLog(
            `Warning: Generated ${questionsArray.length} questions but requested ${options.count}`,
          );
        }

        return questionsArray;
      } catch (parseError) {
        console.error('Failed to process LLM response:', parseError);
        renderLog('Failed to process LLM response:', parseError);

        // Return a fallback question
        return [
          {
            question: 'Sample question generated from your content',
            choices: ['Option A', 'Option B', 'Option C', 'Option D'],
            answer: 0,
          },
        ];
      }
    }

    renderLog('No response from LLM, returning fallback questions');
    return [
      {
        question: 'What is the main topic of this subject?',
        choices: ['Topic A', 'Topic B', 'Topic C', 'Topic D'],
        answer: 0,
      },
    ];
  } catch (error) {
    console.error('Error generating questions:', error);
    renderLog('Error generating questions:', error);

    // Return fallback questions instead of null
    return [
      {
        question: 'Error occurred while generating questions',
        choices: ['Try again', 'Check files', 'Contact support', 'Restart app'],
        answer: 0,
      },
    ];
  }
}

async function createEmbeddings(
  subjectName: string,
): Promise<number[][] | null> {
  const prompt = `key insights and information about the subject: "${subjectName}"`;
  const result = await LLMService.createEmbedding(prompt);
  if (result.success && result.embeddings) {
    return result.embeddings;
  }
  return null;
}
