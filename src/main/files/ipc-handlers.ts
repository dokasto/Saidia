import { ipcMain, dialog } from 'electron';
import FileManager from './file-manager';
import { DatabaseService } from '../database/services';
import {
  FILE_SYSTEM_EVENTS,
  DOWNLOAD_EVENTS,
  DIALOG_EVENTS,
} from '../../constants/events';
import * as path from 'path';

const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export default function setupFilesIPCHandlers() {
  // File upload and process handler
  ipcMain.handle(
    FILE_SYSTEM_EVENTS.UPLOAD_AND_PROCESS,
    async (event, filePath: string, subjectId: string) => {
      try {
        console.log('=== File Upload Request ===');
        console.log('File upload request:', {
          filePath,
          subjectId,
        });

        const originalFilename = path.basename(filePath);

        const doc = await FileManager.loadFile(filePath);

        console.log('doc', doc);

        return;

        if (doc.length > 0) {
          const embeddings = await FileManager.embed(doc);
          return;
        }

        return;

        // Store the file using FileManager
        const fileInfo = await FileManager.storeFile(
          filePath,
          subjectId,
          originalFilename,
        );

        console.log('File stored successfully:', fileInfo);

        // Create file record in database
        const file_id = `file_${Date.now()}_${originalFilename.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const dbResult = await DatabaseService.createFile(
          file_id,
          subjectId,
          originalFilename,
          fileInfo.relativePath,
        );

        if (dbResult) {
          console.log('File record created in database:', dbResult);
          return {
            success: true,
            data: {
              ...dbResult,
              size: fileInfo.size,
              storedPath: fileInfo.storedPath,
            },
          };
        } else {
          // If database creation failed, clean up the stored file
          await FileManager.deleteFile(fileInfo.relativePath);
          return {
            success: false,
            error: 'Failed to create file record in database',
          };
        }
      } catch (error) {
        console.error('File upload error:', error);
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(FILE_SYSTEM_EVENTS.GET_STORAGE_PATH, async () => {
    try {
      const storagePath = FileManager.getStoragePath();
      return { success: true, data: storagePath };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    FILE_SYSTEM_EVENTS.GET_ABSOLUTE_PATH,
    async (event, relativePath: string) => {
      try {
        const absolutePath = FileManager.getAbsolutePath(relativePath);
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
        const info = await FileManager.getFileInfo(relativePath);
        return { success: true, data: info };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(FILE_SYSTEM_EVENTS.CHECK_INITIALIZATION, async () => {
    try {
      const storagePath = FileManager.getStoragePath();
      const isInitialized = !!storagePath; // FileManager is initialized if it has a storage path
      return {
        success: true,
        data: {
          isInitialized,
          storagePath,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  // Dialog handlers
  ipcMain.handle(DIALOG_EVENTS.SHOW_OPEN_DIALOG, async (event, options) => {
    try {
      const result = await dialog.showOpenDialog(options);
      return result;
    } catch (error) {
      return { canceled: true, filePaths: [] };
    }
  });

  // Download handlers
  ipcMain.handle(
    DOWNLOAD_EVENTS.DOWNLOAD_FILES,
    async (event, urls: string[], folderName?: string) => {
      console.log('IPC: Download files request received:', urls);
      if (folderName) {
        console.log('IPC: Using custom folder:', folderName);
      }

      try {
        const results = await FileManager.downloadFiles(
          urls,
          (progress) => {
            console.log('IPC: Sending progress update:', progress);
            // Send progress updates to renderer with download ID
            event.sender.send(DOWNLOAD_EVENTS.PROGRESS, progress);
          },
          folderName,
        );

        console.log('IPC: Download results:', results);
        return { success: true, data: results };
      } catch (error) {
        console.error('IPC: Download error:', error);
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(DOWNLOAD_EVENTS.GET_DOWNLOADED_FILES, async () => {
    try {
      const files = await FileManager.getDownloadedFiles();
      return { success: true, data: files };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    DOWNLOAD_EVENTS.DELETE_DOWNLOADED_FILE,
    async (event, filename: string) => {
      try {
        const success = await FileManager.deleteDownloadedFile(filename);
        return { success, data: { deleted: success } };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(DOWNLOAD_EVENTS.GET_DOWNLOADS_PATH, async () => {
    try {
      const downloadsPath = FileManager.getDownloadsPath();
      return { success: true, data: downloadsPath };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });
}
