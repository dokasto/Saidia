import { ipcMain } from 'electron';
import LLMService from './services';
import { LLM_EVENTS } from '../../constants/events';

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
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
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
