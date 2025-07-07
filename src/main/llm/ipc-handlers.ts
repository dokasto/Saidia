import { ipcMain } from 'electron';
import LLMService from './services';
import { LLM_EVENTS } from '../../constants/events';
import { type GenerateRequest } from 'ollama';

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
    LLM_EVENTS.CREATE_EMBEDDING,
    async (event, input: string | string[]) => {
      try {
        const result = await LLMService.createEmbedding(input);
        return result;
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    LLM_EVENTS.GENERATE,
    async (event, prompt: GenerateRequest) => {
      try {
        const result = await LLMService.generate(prompt);
        return result;
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );
}
