import { useCallback } from 'react';
import { FILE_EVENTS, FILE_SYSTEM_EVENTS } from '../../constants/events';

interface DatabaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export const useFiles = () => {
  // File system operations
  const uploadFile = useCallback(
    async (filePath: string, subjectId: string) => {
      return window.electron.ipcRenderer.invoke(
        FILE_SYSTEM_EVENTS.UPLOAD,
        filePath,
        subjectId,
      ) as Promise<DatabaseResponse>;
    },
    [],
  );

  const getStoragePath = useCallback(async () => {
    return window.electron.ipcRenderer.invoke(
      FILE_SYSTEM_EVENTS.GET_STORAGE_PATH,
    ) as Promise<DatabaseResponse>;
  }, []);

  const getAbsolutePath = useCallback(async (relativePath: string) => {
    return window.electron.ipcRenderer.invoke(
      FILE_SYSTEM_EVENTS.GET_ABSOLUTE_PATH,
      relativePath,
    ) as Promise<DatabaseResponse>;
  }, []);

  const fileExists = useCallback(async (relativePath: string) => {
    return window.electron.ipcRenderer.invoke(
      FILE_SYSTEM_EVENTS.EXISTS,
      relativePath,
    ) as Promise<DatabaseResponse>;
  }, []);

  const getFileInfo = useCallback(async (relativePath: string) => {
    return window.electron.ipcRenderer.invoke(
      FILE_SYSTEM_EVENTS.GET_INFO,
      relativePath,
    ) as Promise<DatabaseResponse>;
  }, []);

  const checkFileManagerInitialization = useCallback(async () => {
    return window.electron.ipcRenderer.invoke(
      FILE_SYSTEM_EVENTS.CHECK_INITIALIZATION,
    ) as Promise<DatabaseResponse>;
  }, []);

  return {
    uploadFile,
    getStoragePath,
    getAbsolutePath,
    fileExists,
    getFileInfo,
    checkFileManagerInitialization,
  };
};
