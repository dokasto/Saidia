import { ipcMain, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import download from './dowload';
import { removeFile } from './manager';
import { DOWNLOAD_EVENTS } from '../../constants/events';

const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export default function setupDownloadIPCHandlers() {
  ipcMain.handle(
    DOWNLOAD_EVENTS.DOWNLOAD_FILES,
    async (event, urls: string[], folderName?: string) => {
      try {
        // Get downloads directory
        const downloadsPath = folderName
          ? path.join(app.getPath('userData'), 'downloads', folderName)
          : path.join(app.getPath('userData'), 'downloads');

        // Ensure directory exists
        if (!fs.existsSync(downloadsPath)) {
          fs.mkdirSync(downloadsPath, { recursive: true });
        }

        const results = await download(urls, downloadsPath, (progress) => {
          event.sender.send(DOWNLOAD_EVENTS.PROGRESS, progress);
        });

        return { success: true, data: results };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(DOWNLOAD_EVENTS.GET_DOWNLOADED_FILES, async (_event) => {
    try {
      const downloadsPath = path.join(app.getPath('userData'), 'downloads');

      if (!fs.existsSync(downloadsPath)) {
        return { success: true, data: [] };
      }

      const files = await fs.promises.readdir(downloadsPath);
      const fileStats = await Promise.all(
        files.map(async (filename: string) => {
          const filePath = path.join(downloadsPath, filename);
          const stats = await fs.promises.stat(filePath);
          return {
            filename,
            size: stats.size,
            modified: stats.mtime,
            path: filePath,
          };
        }),
      );

      return { success: true, data: fileStats };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    DOWNLOAD_EVENTS.DELETE_DOWNLOADED_FILE,
    async (_event, filename: string) => {
      try {
        const downloadsPath = path.join(app.getPath('userData'), 'downloads');
        const filePath = path.join(downloadsPath, filename);

        await removeFile(filePath);
        return { success: true };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(DOWNLOAD_EVENTS.GET_DOWNLOADS_PATH, async (_event) => {
    try {
      const downloadsPath = path.join(app.getPath('userData'), 'downloads');
      return { success: true, data: downloadsPath };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });
}
