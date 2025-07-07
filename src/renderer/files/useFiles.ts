import { useCallback, useEffect, useState } from 'react';
import { FILE_SYSTEM_EVENTS } from '../../constants/events';

interface DatabaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export const useFiles = () => {
  const [downloadProgress, setDownloadProgress] = useState<
    Map<
      string,
      {
        downloadId: string;
        url: string;
        downloaded: number;
        total: number;
        percentage: number;
        filename?: string;
        status: 'starting' | 'downloading' | 'completed' | 'error';
      }
    >
  >(new Map());

  // Set up download progress listener
  useEffect(() => {
    const unsubscribe = window.electron.download.onProgress((progress) => {
      setDownloadProgress((prev) => {
        const newMap = new Map(prev);
        newMap.set(progress.downloadId, progress);
        return newMap;
      });
    });

    return unsubscribe;
  }, []);

  // File system operations
  const uploadFile = useCallback(
    async (filePath: string, subjectId: string) => {
      return window.electron.ipcRenderer.invoke(
        FILE_SYSTEM_EVENTS.UPLOAD_AND_PROCESS,
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

  // Subject-specific file operations
  const getSubjectFilePath = useCallback(
    async (subjectId: string, filename: string) => {
      return window.electron.ipcRenderer.invoke(
        FILE_SYSTEM_EVENTS.GET_SUBJECT_FILE_PATH,
        subjectId,
        filename,
      ) as Promise<DatabaseResponse>;
    },
    [],
  );

  const listSubjectFiles = useCallback(async (subjectId: string) => {
    return window.electron.ipcRenderer.invoke(
      FILE_SYSTEM_EVENTS.LIST_SUBJECT_FILES,
      subjectId,
    ) as Promise<DatabaseResponse>;
  }, []);

  const deleteSubjectFile = useCallback(
    async (subjectId: string, filename: string) => {
      return window.electron.ipcRenderer.invoke(
        FILE_SYSTEM_EVENTS.DELETE_SUBJECT_FILE,
        subjectId,
        filename,
      ) as Promise<DatabaseResponse>;
    },
    [],
  );

  // Download operations
  const downloadFiles = useCallback(
    async (urls: string[], folderName?: string) => {
      console.log('Frontend: Starting download of URLs:', urls);
      if (folderName) {
        console.log('Frontend: Using custom folder:', folderName);
      }
      setDownloadProgress(new Map()); // Reset progress

      try {
        const result = await window.electron.download.downloadFiles(
          urls,
          folderName,
        );
        console.log('Frontend: Download result:', result);

        // Keep the progress map for a while to show completion status
        setTimeout(() => setDownloadProgress(new Map()), 5000);
        return result as Promise<DatabaseResponse>;
      } catch (error) {
        console.error('Frontend: Download error:', error);
        throw error;
      }
    },
    [],
  );

  const getDownloadedFiles = useCallback(async () => {
    return window.electron.download.getDownloadedFiles() as Promise<DatabaseResponse>;
  }, []);

  const deleteDownloadedFile = useCallback(async (filename: string) => {
    return window.electron.download.deleteDownloadedFile(
      filename,
    ) as Promise<DatabaseResponse>;
  }, []);

  const getDownloadsPath = useCallback(async () => {
    return window.electron.download.getDownloadsPath() as Promise<DatabaseResponse>;
  }, []);

  return {
    // File system operations
    uploadFile,
    getStoragePath,
    getAbsolutePath,
    fileExists,
    getFileInfo,
    checkFileManagerInitialization,

    // Subject-specific file operations
    getSubjectFilePath,
    listSubjectFiles,
    deleteSubjectFile,

    // Download operations
    downloadFiles,
    getDownloadedFiles,
    deleteDownloadedFile,
    getDownloadsPath,
    downloadProgress,
  };
};
