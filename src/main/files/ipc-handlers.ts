import { ipcMain, dialog } from 'electron';
import FileManager from './file-manager';
import { FILE_SYSTEM_EVENTS, DIALOG_EVENTS } from '../../constants/events';

const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export default function setupFilesIPCHandlers() {
  ipcMain.handle(
    FILE_SYSTEM_EVENTS.UPLOAD_AND_PROCESS,
    async (event, filePath: string, subjectId: string) => {
      try {
        const result = await FileManager.uploadAndProcessFile(
          filePath,
          subjectId,
        );
        return result;
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(FILE_SYSTEM_EVENTS.GET_STORAGE_PATH, async (event) => {
    try {
      const storagePath = await FileManager.getStoragePath();
      return { success: true, data: storagePath };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    FILE_SYSTEM_EVENTS.GET_ABSOLUTE_PATH,
    async (event, relativePath: string) => {
      try {
        const absolutePath = await FileManager.getAbsolutePath(relativePath);
        return { success: true, data: absolutePath };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    FILE_SYSTEM_EVENTS.EXISTS,
    async (event, relativePath: string) => {
      try {
        const exists = await FileManager.fileExists(relativePath);
        return { success: true, data: exists };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    FILE_SYSTEM_EVENTS.GET_INFO,
    async (event, relativePath: string) => {
      try {
        const fileInfo = await FileManager.getFileInfo(relativePath);
        return { success: true, data: fileInfo };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(FILE_SYSTEM_EVENTS.CHECK_INITIALIZATION, async (event) => {
    try {
      const isInitialized = await FileManager.checkFileManagerInitialization();
      return { success: true, data: isInitialized };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    FILE_SYSTEM_EVENTS.GET_SUBJECT_FILE_PATH,
    async (event, subjectId: string, filename: string) => {
      try {
        const filePath = await FileManager.getSubjectFilePath(
          subjectId,
          filename,
        );
        return { success: true, data: filePath };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    FILE_SYSTEM_EVENTS.LIST_SUBJECT_FILES,
    async (event, subjectId: string) => {
      try {
        const files = await FileManager.listSubjectFiles(subjectId);
        return { success: true, data: files };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    FILE_SYSTEM_EVENTS.DELETE_SUBJECT_FILE,
    async (event, subjectId: string, filename: string) => {
      try {
        await FileManager.deleteSubjectFile(subjectId, filename);
        return { success: true };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(DIALOG_EVENTS.SHOW_OPEN_DIALOG, async (event, options) => {
    try {
      const result = await dialog.showOpenDialog(options);
      return result;
    } catch (error) {
      return { canceled: true, filePaths: [] };
    }
  });
}
