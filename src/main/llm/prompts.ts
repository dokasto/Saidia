import { GenerateQuestionOptions, QuestionType } from '../../constants/types';
import { z } from 'zod';

// Define Zod schemas for question types
export const QuestionSchema = z.object({
  question: z.string().describe('The question text'),
  choices: z.array(z.string()).describe('Array of choice options'),
  answer: z
    .union([z.number(), z.null()])
    .describe(
      'Index of correct answer (0-3) or null for true/false/fill-in-blank',
    ),
});

export const QuestionsArraySchema = z.array(QuestionSchema);

// Base prompt template that can be reused
export const BASE_PROMPT_TEMPLATE = (
  subjectName: string,
  options: GenerateQuestionOptions,
  chunks: string[],
) => `You are an expert educational content creator specializing in creating high-quality questions for the subject: "${subjectName}".

TASK: Generate exactly ${options.count} questions based on the provided educational content for the subject "${subjectName}".

IMPORTANT: You must generate exactly ${options.count} questions - no more, no less.

REQUIREMENTS:
- Subject: "${subjectName}"
- Difficulty level: ${options.difficulty}
- Question type: {QUESTION_TYPE_PLACEHOLDER}
- Each question must test understanding of the "${subjectName}" content, not just memorization
- Questions should cover different aspects and sections of the "${subjectName}" content
- Avoid overly obvious or trivial questions
- Base all questions on the actual "${subjectName}" content provided
- Focus on "${subjectName}" concepts, principles, and learning objectives
- Questions should be specific to the "${subjectName}" subject area

{QUESTION_TYPE_SPECIFIC_INSTRUCTIONS}

QUALITY GUIDELINES:
- Questions should be clear and unambiguous for "${subjectName}" assessment
- Questions should test different cognitive levels based on difficulty:
  * Easy: Basic recall and understanding of "${subjectName}" concepts
  * Medium: Application and analysis of "${subjectName}" principles
  * Hard: Synthesis and evaluation of "${subjectName}" content
- Ensure questions are appropriate for "${subjectName}" assessment and learning
- Use subject-specific terminology and concepts from "${subjectName}"
- Ask questions directly without using phrases like "According to the text", "According to the document", "Based on the content", "In the document", "From the text", etc.
- Start questions directly with the question content (e.g., "What was..." instead of "According to the text, what was...")
- Never reference any document, text, or content source in the question wording

CRITICAL RESPONSE FORMAT REQUIREMENTS:
- You MUST return a JSON array containing exactly ${options.count} questions
- The response must start with [ and end with ]
- Each question must be a separate object within the array
- Do NOT include any text before or after the JSON array
- Do NOT include explanations, markdown formatting, or additional text
- The response must be valid JSON that can be parsed directly
- If you cannot generate ${options.count} questions from the "${subjectName}" content, create additional questions by:
  * Varying the wording of "${subjectName}" concepts mentioned in the content
  * Asking questions from different angles about the same "${subjectName}" content
  * Creating questions about different sections or parts of the "${subjectName}" content
  * Using different difficulty levels within the same "${subjectName}" topic
  * Focusing on "${subjectName}" details, implications, or applications mentioned in the content

EXAMPLE RESPONSE FORMAT (for ${options.count} questions):
[
  {
    "question": "Question 1 text here",
    "choices": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0
  },
  {
    "question": "Question 2 text here",
    "choices": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 1
  }
  ${options.count > 2 ? ',\n  {\n    "question": "Question 3 text here",\n    "choices": ["Option A", "Option B", "Option C", "Option D"],\n    "answer": 2\n  }' : ''}
  ${options.count > 3 ? ',\n  {\n    "question": "Question 4 text here",\n    "choices": ["Option A", "Option B", "Option C", "Option D"],\n    "answer": 3\n  }' : ''}
  ${options.count > 4 ? ',\n  {\n    "question": "Question 5 text here",\n    "choices": ["Option A", "Option B", "Option C", "Option D"],\n    "answer": 0\n  }' : ''}
]

"${subjectName}" CONTENT:
${chunks.join('\n\n')}

FINAL INSTRUCTIONS:
- Generate exactly ${options.count} questions from the "${subjectName}" content above - this is MANDATORY
- Return ONLY a JSON array starting with [ and ending with ]
- Do not include any text before or after the JSON array
- Ensure the response is valid JSON that can be parsed directly
- The JSON schema requires exactly ${options.count} items - do not return fewer
- All questions must be based on the "${subjectName}" content provided above
- Make questions specific to the "${subjectName}" subject area

Generate exactly ${options.count} questions from the "${subjectName}" content now:`;

// Question type specific instructions
export const QUESTION_TYPE_INSTRUCTIONS = {
  [QuestionType.MULTIPLE_CHOICE]: {
    type: 'Multiple choice with 4 options',
    format: `QUESTION FORMAT:
You must return an array of exactly the requested number of questions. Each question object must follow this exact JSON structure:
{
  "question": "Clear, concise question text based on the subject content",
  "choices": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 0
}

QUALITY GUIDELINES:
- All questions must be based on the subject content provided
- All choices should be plausible and well-distributed
- Correct answer should be randomly positioned (0-3)
- Incorrect choices should be reasonable distractors based on the subject content
- Avoid "all of the above" or "none of the above" options
- Generate exactly the requested number of unique questions - no more, no less
- Ensure questions cover different parts of the subject content
- Use subject-specific terminology and concepts
- Ask questions directly without using phrases like "According to the text", "According to the document", "Based on the content", "In the document", "From the text", etc.
- Start questions directly with the question content
- Never reference any document, text, or content source in the question wording`,
    zodSchema: QuestionsArraySchema.refine(
      (questions) => questions.every((q) => q.choices.length === 4),
      { message: 'Each question must have exactly 4 choices' },
    ).refine(
      (questions) =>
        questions.every(
          (q) => typeof q.answer === 'number' && q.answer >= 0 && q.answer <= 3,
        ),
      { message: 'Answer must be a number between 0 and 3' },
    ),
  },

  [QuestionType.TRUE_FALSE]: {
    type: 'True/False questions',
    format: `QUESTION FORMAT:
You must return an array of exactly the requested number of questions. Each question object must follow this exact JSON structure:
{
  "question": "Clear, concise statement about the subject content to evaluate. True or False?",
  "choices": ["True", "False"],
  "answer": 0
}

QUALITY GUIDELINES:
- All questions must be based on the subject content provided
- Questions should be clear statements that can be evaluated as true or false
- End each question with "True or False?" to indicate the question type
- Avoid statements that are obviously true or false
- IMPORTANT: Ensure a good mix of true and false statements - aim for roughly 50/50 distribution
- Randomly distribute true and false answers throughout the questions
- Focus on concepts from the subject content that require understanding, not just facts
- Generate exactly the requested number of unique questions - no more, no less
- Ensure questions cover different parts of the subject content
- Use subject-specific terminology and concepts
- Ask questions directly without using phrases like "According to the text", "According to the document", "Based on the content", "In the document", "From the text", etc.
- Start questions directly with the statement content
- Never reference any document, text, or content source in the question wording`,
    zodSchema: QuestionsArraySchema.refine(
      (questions) =>
        questions.every(
          (q) =>
            q.choices.length === 2 &&
            q.choices.includes('True') &&
            q.choices.includes('False'),
        ),
      {
        message:
          'True/false questions must have exactly 2 choices: True and False',
      },
    ).refine(
      (questions) =>
        questions.every(
          (q) =>
            typeof q.answer === 'number' && (q.answer === 0 || q.answer === 1),
        ),
      {
        message:
          'True/false questions must have answer as 0 (True) or 1 (False)',
      },
    ),
  },

  [QuestionType.FILL_IN_THE_BLANK]: {
    type: 'Fill in the blank questions',
    format: `QUESTION FORMAT:
You must return an array of exactly the requested number of questions. Each question object must follow this exact JSON structure:
{
  "question": "What is mentioned in the subject about [specific topic]?",
  "choices": [],
  "answer": null
}

QUALITY GUIDELINES:
- All questions must be based on the subject content provided
- Questions should be direct and clear about subject content
- Focus on key concepts and important information from the subject content
- Avoid trivial or overly specific details
- Questions should test understanding of the subject content
- Make questions natural and conversational
- Generate exactly the requested number of unique questions - no more, no less
- Ensure questions cover different parts of the subject content
- Use subject-specific terminology and concepts
- Ask questions directly without using phrases like "According to the text", "According to the document", "Based on the content", "In the document", "From the text", etc.
- Start questions directly with the question content
- Never reference any document, text, or content source in the question wording`,
    zodSchema: QuestionsArraySchema.refine(
      (questions) => questions.every((q) => q.choices.length === 0),
      { message: 'Fill in the blank questions must have empty choices array' },
    ).refine((questions) => questions.every((q) => q.answer === null), {
      message: 'Fill in the blank questions must have null answer',
    }),
  },
};

// Helper function to generate the complete prompt and get Zod schema
export function generatePromptAndSchema(
  subjectName: string,
  options: GenerateQuestionOptions,
  chunks: string[],
): { prompt: string; zodSchema: any } {
  const typeInstructions = QUESTION_TYPE_INSTRUCTIONS[options.type];

  if (!typeInstructions) {
    throw new Error(`Unsupported question type: ${options.type}`);
  }

  const prompt = BASE_PROMPT_TEMPLATE(subjectName, options, chunks)
    .replace('{QUESTION_TYPE_PLACEHOLDER}', typeInstructions.type)
    .replace('{QUESTION_TYPE_SPECIFIC_INSTRUCTIONS}', typeInstructions.format);

  // Create a dynamic Zod schema with the exact count
  const dynamicZodSchema = typeInstructions.zodSchema.refine(
    (questions) => questions.length === options.count,
    { message: `Must generate exactly ${options.count} questions` },
  );

  return {
    prompt,
    zodSchema: dynamicZodSchema,
  };
}

// Embedding prompt function for subject content
export function generateEmbeddingPrompt(
  content: string,
  subjectName: string,
): string {
  return `Represent the following ${subjectName} content for retrieval:
"""
${content}
"""`;
}
