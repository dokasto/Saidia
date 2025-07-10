import { ipcMain } from 'electron';
import EmbeddingService from '../services/embedding';
import { EMBEDDING_EVENTS } from '../../../constants/events';
import { IPCResponse } from '../../setup-ipc-handlers';
import { TEmbedding } from '../../../types/Embedding';

export default function setupEmbeddingHandlers() {
  ipcMain.handle(
    EMBEDDING_EVENTS.ADD,
    async (
      _event,
      subject_id: string,
      file_id: string,
      text: string,
      embedding: number[],
    ): Promise<IPCResponse<TEmbedding>> => {
      try {
        const result = await EmbeddingService.addEmbedding(
          subject_id,
          file_id,
          text,
          embedding,
        );
        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          data: null as any,
        };
      }
    },
  );

  ipcMain.handle(
    EMBEDDING_EVENTS.SEARCH_SIMILAR,
    async (
      _event,
      queryEmbedding: number[],
      limit: number = 10,
      subject_id?: string,
    ): Promise<IPCResponse<TEmbedding[]>> => {
      try {
        const results = await EmbeddingService.searchSimilar(
          queryEmbedding,
          limit,
          subject_id,
        );
        return { success: true, data: results };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          data: null as any,
        };
      }
    },
  );

  ipcMain.handle(
    EMBEDDING_EVENTS.GET_BY_FILE,
    async (_event, file_id: string): Promise<IPCResponse<TEmbedding[]>> => {
      try {
        await EmbeddingService.getEmbeddingsByFile(file_id);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          data: null as any,
        };
      }
    },
  );

  ipcMain.handle(
    EMBEDDING_EVENTS.GET_BY_SUBJECT,
    async (_event, subject_id: string): Promise<IPCResponse<TEmbedding[]>> => {
      try {
        const embeddings =
          await EmbeddingService.getEmbeddingsBySubject(subject_id);
        return { success: true, data: embeddings };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          data: null as any,
        };
      }
    },
  );

  ipcMain.handle(
    EMBEDDING_EVENTS.DELETE_BY_FILE,
    async (_event, file_id: string): Promise<IPCResponse> => {
      try {
        EmbeddingService.deleteEmbeddingsByFile(file_id);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          data: null as any,
        };
      }
    },
  );

  ipcMain.handle(
    EMBEDDING_EVENTS.DELETE_BY_SUBJECT,
    async (_event, subject_id: string): Promise<IPCResponse> => {
      try {
        EmbeddingService.deleteEmbeddingsBySubject(subject_id);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          data: null as any,
        };
      }
    },
  );
}
