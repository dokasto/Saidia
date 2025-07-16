/* eslint-disable no-console */
import { ipcMain, dialog } from 'electron';
import { FILE_SYSTEM_EVENTS, DIALOG_EVENTS } from '../../constants/events';
import {
  uploadAndProcessFile,
  listSubjectFiles,
  deleteSubjectFile,
} from './manager';

export default function setupFilesIPCHandlers() {
  ipcMain.handle(
    DIALOG_EVENTS.SHOW_OPEN_DIALOG,
    async (_event, options, subjectId: string) => {
      try {
        const result = await dialog.showOpenDialog(options);
        if (!result.canceled && result.filePaths.length > 0) {
          return await uploadAndProcessFile(result.filePaths[0], subjectId);
        }
        return { success: false, error: 'No files selected' };
      } catch (error) {
        console.error(error);
        return {
          success: false,
          filePaths: [],
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  ipcMain.handle(
    FILE_SYSTEM_EVENTS.LIST_SUBJECT_FILES,
    async (_event, subjectId: string) => {
      try {
        const files = await listSubjectFiles(subjectId);
        return { success: true, data: files };
      } catch (error) {
        console.error(error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  ipcMain.handle(
    FILE_SYSTEM_EVENTS.DELETE_SUBJECT_FILE,
    async (_event, subjectId: string, filename: string) => {
      try {
        await deleteSubjectFile(subjectId, filename);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );
}
