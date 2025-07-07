import { ipcMain } from 'electron';
import DatabaseService from './services';
import {
  SUBJECT_EVENTS,
  FILE_EVENTS,
  QUESTION_EVENTS,
  TAG_EVENTS,
  EMBEDDING_EVENTS,
} from '../../constants/events';

const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export default function setupDatabaseIPCHandlers() {
  // Subject handlers
  ipcMain.handle(
    SUBJECT_EVENTS.CREATE,
    async (event, subject_id: string, name: string) => {
      try {
        const subject = await DatabaseService.createSubject(subject_id, name);
        return { success: true, data: subject };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(SUBJECT_EVENTS.GET_ALL, async () => {
    try {
      const subjects = await DatabaseService.getSubjects();
      return { success: true, data: subjects };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(SUBJECT_EVENTS.GET_ONE, async (event, subject_id: string) => {
    try {
      const subject = await DatabaseService.getSubject(subject_id);
      return { success: true, data: subject };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    SUBJECT_EVENTS.UPDATE,
    async (event, subject_id: string, updates: any) => {
      try {
        const result = await DatabaseService.updateSubject(subject_id, updates);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(SUBJECT_EVENTS.DELETE, async (event, subject_id: string) => {
    try {
      const result = await DatabaseService.deleteSubject(subject_id);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  // File handlers
  ipcMain.handle(
    FILE_EVENTS.CREATE,
    async (
      event,
      file_id: string,
      subject_id: string,
      filename: string,
      filepath: string,
    ) => {
      try {
        const file = await DatabaseService.createFile(
          file_id,
          subject_id,
          filename,
          filepath,
        );
        return { success: true, data: file };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(FILE_EVENTS.GET_ALL, async (event, subject_id?: string) => {
    try {
      const files = await DatabaseService.getFiles(subject_id);
      return { success: true, data: files };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(FILE_EVENTS.GET_ONE, async (event, file_id: string) => {
    try {
      const file = await DatabaseService.getFile(file_id);
      return { success: true, data: file };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    FILE_EVENTS.UPDATE,
    async (event, file_id: string, updates: any) => {
      try {
        const result = await DatabaseService.updateFile(file_id, updates);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(FILE_EVENTS.DELETE, async (event, file_id: string) => {
    try {
      const result = await DatabaseService.deleteFile(file_id);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  // Question handlers
  ipcMain.handle(
    QUESTION_EVENTS.CREATE,
    async (
      event,
      question_id: string,
      subject_id: string,
      difficulty: string,
      content: string,
      options_json: string,
      tags?: string[],
    ) => {
      try {
        const question = await DatabaseService.createQuestion(
          question_id,
          subject_id,
          difficulty as any,
          content,
          options_json,
          tags,
        );
        return { success: true, data: question };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    QUESTION_EVENTS.GET_ALL,
    async (event, subject_id?: string, difficulty?: string) => {
      try {
        const questions = await DatabaseService.getQuestions(
          subject_id,
          difficulty,
        );
        return { success: true, data: questions };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    QUESTION_EVENTS.GET_ONE,
    async (event, question_id: string) => {
      try {
        const question = await DatabaseService.getQuestion(question_id);
        return { success: true, data: question };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    QUESTION_EVENTS.UPDATE,
    async (event, question_id: string, updates: any) => {
      try {
        const result = await DatabaseService.updateQuestion(
          question_id,
          updates,
        );
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(QUESTION_EVENTS.DELETE, async (event, question_id: string) => {
    try {
      const result = await DatabaseService.deleteQuestion(question_id);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  // Tag handlers
  ipcMain.handle(TAG_EVENTS.CREATE, async (event, name: string) => {
    try {
      const tag = await DatabaseService.createTag(name);
      return { success: true, data: tag };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(TAG_EVENTS.GET_ALL, async () => {
    try {
      const tags = await DatabaseService.getTags();
      return { success: true, data: tags };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    TAG_EVENTS.ADD_TO_QUESTION,
    async (event, question_id: string, tagNames: string[]) => {
      try {
        await DatabaseService.addTagsToQuestion(question_id, tagNames);
        return { success: true };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    TAG_EVENTS.REMOVE_FROM_QUESTION,
    async (event, question_id: string, tag_id: number) => {
      try {
        const result = await DatabaseService.removeTagFromQuestion(
          question_id,
          tag_id,
        );
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  // Embedding handlers
  ipcMain.handle(
    EMBEDDING_EVENTS.ADD,
    async (
      event,
      chunk_id: string,
      subject_id: string,
      file_id: string,
      chunk_index: number,
      text: string,
      embedding: number[],
    ) => {
      try {
        await DatabaseService.addEmbedding(
          chunk_id,
          subject_id,
          file_id,
          chunk_index,
          text,
          embedding,
        );
        return { success: true };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    EMBEDDING_EVENTS.SEARCH_SIMILAR,
    async (
      event,
      queryEmbedding: number[],
      limit: number = 10,
      subject_id?: string,
    ) => {
      try {
        const results = await DatabaseService.searchSimilar(
          queryEmbedding,
          limit,
          subject_id,
        );
        return { success: true, data: results };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    EMBEDDING_EVENTS.GET_BY_FILE,
    async (event, file_id: string) => {
      try {
        const embeddings = await DatabaseService.getEmbeddingsByFile(file_id);
        return { success: true, data: embeddings };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    EMBEDDING_EVENTS.GET_BY_SUBJECT,
    async (event, subject_id: string) => {
      try {
        const embeddings =
          await DatabaseService.getEmbeddingsBySubject(subject_id);
        return { success: true, data: embeddings };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );
}
