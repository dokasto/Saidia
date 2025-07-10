import { ipcMain } from 'electron';
import LLMService from './services';
import { LLM_EVENTS } from '../../constants/events';
import { QuestionType, QuestionDifficulty } from '../../types/Question';
import { generateQuestions } from './question-generation';

// Define the interface inline to avoid import issues
interface GenerateQuestionOptions {
  count: number;
  difficulty: QuestionDifficulty;
  type: QuestionType;
}

const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export default function setupLLMIPCHandlers() {
  ipcMain.handle(LLM_EVENTS.INIT, async (event) => {
    try {
      await LLMService.init((progress) => {
        event.sender.send(LLM_EVENTS.PROGRESS, progress);
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    LLM_EVENTS.GENERATE_QUESTIONS,
    async (event, subjectId: string, options: GenerateQuestionOptions) => {
      return await generateQuestions(subjectId, options);
    },
  );

  ipcMain.handle(LLM_EVENTS.GENERATE, async (event, request: any) => {
    try {
      const result = await LLMService.generate(request);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });
}
