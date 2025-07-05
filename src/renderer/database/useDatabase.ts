import { useCallback } from 'react';
import {
  SUBJECT_EVENTS,
  QUESTION_EVENTS,
  TAG_EVENTS,
  EMBEDDING_EVENTS,
  FILE_EVENTS,
} from '../../constants/events';

interface DatabaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export const useDatabase = () => {
  // Subject operations
  const createSubject = useCallback(async (subjectId: string, name: string) => {
    return window.electron.ipcRenderer.invoke(
      SUBJECT_EVENTS.CREATE,
      subjectId,
      name,
    ) as Promise<DatabaseResponse>;
  }, []);

  const getSubjects = useCallback(async () => {
    return window.electron.ipcRenderer.invoke(
      SUBJECT_EVENTS.GET_ALL,
    ) as Promise<DatabaseResponse>;
  }, []);

  const getSubject = useCallback(async (subjectId: string) => {
    return window.electron.ipcRenderer.invoke(
      SUBJECT_EVENTS.GET_ONE,
      subjectId,
    ) as Promise<DatabaseResponse>;
  }, []);

  const updateSubject = useCallback(async (subjectId: string, updates: any) => {
    return window.electron.ipcRenderer.invoke(
      SUBJECT_EVENTS.UPDATE,
      subjectId,
      updates,
    ) as Promise<DatabaseResponse>;
  }, []);

  const deleteSubject = useCallback(async (subjectId: string) => {
    return window.electron.ipcRenderer.invoke(
      SUBJECT_EVENTS.DELETE,
      subjectId,
    ) as Promise<DatabaseResponse>;
  }, []);

  // Question operations
  const createQuestion = useCallback(
    async (
      questionId: string,
      subjectId: string,
      difficulty: string,
      content: string,
      optionsJson: string,
      tags?: string[],
    ) => {
      return window.electron.ipcRenderer.invoke(
        QUESTION_EVENTS.CREATE,
        questionId,
        subjectId,
        difficulty,
        content,
        optionsJson,
        tags,
      ) as Promise<DatabaseResponse>;
    },
    [],
  );

  const getQuestions = useCallback(
    async (subjectId?: string, difficulty?: string) => {
      return window.electron.ipcRenderer.invoke(
        QUESTION_EVENTS.GET_ALL,
        subjectId,
        difficulty,
      ) as Promise<DatabaseResponse>;
    },
    [],
  );

  const getQuestion = useCallback(async (questionId: string) => {
    return window.electron.ipcRenderer.invoke(
      QUESTION_EVENTS.GET_ONE,
      questionId,
    ) as Promise<DatabaseResponse>;
  }, []);

  const updateQuestion = useCallback(
    async (questionId: string, updates: any) => {
      return window.electron.ipcRenderer.invoke(
        QUESTION_EVENTS.UPDATE,
        questionId,
        updates,
      ) as Promise<DatabaseResponse>;
    },
    [],
  );

  const deleteQuestion = useCallback(async (questionId: string) => {
    return window.electron.ipcRenderer.invoke(
      QUESTION_EVENTS.DELETE,
      questionId,
    ) as Promise<DatabaseResponse>;
  }, []);

  // Tag operations
  const createTag = useCallback(async (name: string) => {
    return window.electron.ipcRenderer.invoke(
      TAG_EVENTS.CREATE,
      name,
    ) as Promise<DatabaseResponse>;
  }, []);

  const getTags = useCallback(async () => {
    return window.electron.ipcRenderer.invoke(
      TAG_EVENTS.GET_ALL,
    ) as Promise<DatabaseResponse>;
  }, []);

  const addTagsToQuestion = useCallback(
    async (questionId: string, tagNames: string[]) => {
      return window.electron.ipcRenderer.invoke(
        TAG_EVENTS.ADD_TO_QUESTION,
        questionId,
        tagNames,
      ) as Promise<DatabaseResponse>;
    },
    [],
  );

  const removeTagFromQuestion = useCallback(
    async (questionId: string, tagId: number) => {
      return window.electron.ipcRenderer.invoke(
        TAG_EVENTS.REMOVE_FROM_QUESTION,
        questionId,
        tagId,
      ) as Promise<DatabaseResponse>;
    },
    [],
  );

  // Embedding operations
  const addEmbedding = useCallback(
    async (
      chunkId: string,
      subjectId: string,
      fileId: string,
      chunkIndex: number,
      text: string,
      embedding: number[],
    ) => {
      return window.electron.ipcRenderer.invoke(
        EMBEDDING_EVENTS.ADD,
        chunkId,
        subjectId,
        fileId,
        chunkIndex,
        text,
        embedding,
      ) as Promise<DatabaseResponse>;
    },
    [],
  );

  const searchSimilar = useCallback(
    async (queryEmbedding: number[], limit = 10, subjectId?: string) => {
      return window.electron.ipcRenderer.invoke(
        EMBEDDING_EVENTS.SEARCH_SIMILAR,
        queryEmbedding,
        limit,
        subjectId,
      ) as Promise<DatabaseResponse>;
    },
    [],
  );

  const getEmbeddingsByFile = useCallback(async (fileId: string) => {
    return window.electron.ipcRenderer.invoke(
      EMBEDDING_EVENTS.GET_BY_FILE,
      fileId,
    ) as Promise<DatabaseResponse>;
  }, []);

  const getEmbeddingsBySubject = useCallback(async (subjectId: string) => {
    return window.electron.ipcRenderer.invoke(
      EMBEDDING_EVENTS.GET_BY_SUBJECT,
      subjectId,
    ) as Promise<DatabaseResponse>;
  }, []);

  const getEmbeddingsCount = useCallback(async (subjectId?: string) => {
    return window.electron.ipcRenderer.invoke(
      EMBEDDING_EVENTS.GET_COUNT,
      subjectId,
    ) as Promise<DatabaseResponse>;
  }, []);

  const getVectorDbVersion = useCallback(async () => {
    return window.electron.ipcRenderer.invoke(
      EMBEDDING_EVENTS.GET_VECTOR_DB_VERSION,
    ) as Promise<DatabaseResponse>;
  }, []);

  // Database file operations
  const createFile = useCallback(
    async (
      fileId: string,
      subjectId: string,
      filename: string,
      filepath: string,
    ) => {
      return window.electron.ipcRenderer.invoke(
        FILE_EVENTS.CREATE,
        fileId,
        subjectId,
        filename,
        filepath,
      ) as Promise<DatabaseResponse>;
    },
    [],
  );

  const getFiles = useCallback(async (subjectId?: string) => {
    return window.electron.ipcRenderer.invoke(
      FILE_EVENTS.GET_ALL,
      subjectId,
    ) as Promise<DatabaseResponse>;
  }, []);

  const getFile = useCallback(async (fileId: string) => {
    return window.electron.ipcRenderer.invoke(
      FILE_EVENTS.GET_ONE,
      fileId,
    ) as Promise<DatabaseResponse>;
  }, []);

  const updateFile = useCallback(async (fileId: string, updates: any) => {
    return window.electron.ipcRenderer.invoke(
      FILE_EVENTS.UPDATE,
      fileId,
      updates,
    ) as Promise<DatabaseResponse>;
  }, []);

  const deleteFile = useCallback(async (fileId: string) => {
    return window.electron.ipcRenderer.invoke(
      FILE_EVENTS.DELETE,
      fileId,
    ) as Promise<DatabaseResponse>;
  }, []);

  return {
    // Subject operations
    createSubject,
    getSubjects,
    getSubject,
    updateSubject,
    deleteSubject,

    // Question operations
    createQuestion,
    getQuestions,
    getQuestion,
    updateQuestion,
    deleteQuestion,

    // Tag operations
    createTag,
    getTags,
    addTagsToQuestion,
    removeTagFromQuestion,

    // Embedding operations
    addEmbedding,
    searchSimilar,
    getEmbeddingsByFile,
    getEmbeddingsBySubject,
    getEmbeddingsCount,
    getVectorDbVersion,

    // file operations
    createFile,
    getFiles,
    getFile,
    updateFile,
    deleteFile,
  };
};
