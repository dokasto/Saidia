import { ipcMain } from 'electron';
import FileService from '../services/file';
import { FILE_EVENTS } from '../../../constants/events';
import { IPCResponse } from '../../setup-ipc-handlers';
import {
  FileResponse,
  DeleteFileResponse,
  UpdateFileResponse,
} from '../../../types/File';
import crypto from 'crypto';

export default function setupFileHandlers() {
  ipcMain.handle(
    FILE_EVENTS.CREATE,
    async (
      _event,
      subject_id: string,
      filename: string,
      filepath: string,
    ): Promise<IPCResponse<FileResponse>> => {
      try {
        const file = await FileService.createFile(
          crypto.randomUUID(),
          subject_id,
          filename,
          filepath,
        );
        return { success: true, data: file };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  ipcMain.handle(
    FILE_EVENTS.GET_ALL,
    async (
      _event,
      subject_id?: string,
    ): Promise<IPCResponse<FileResponse[]>> => {
      try {
        const files = await FileService.getFiles(subject_id);
        return { success: true, data: files };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  ipcMain.handle(
    FILE_EVENTS.GET_ONE,
    async (
      _event,
      file_id: string,
    ): Promise<IPCResponse<FileResponse | null>> => {
      try {
        const file = await FileService.getFile(file_id);
        return { success: true, data: file };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  ipcMain.handle(
    FILE_EVENTS.UPDATE,
    async (
      _event,
      file_id: string,
      updates: Partial<{ filename: string; filepath: string }>,
    ): Promise<IPCResponse<UpdateFileResponse>> => {
      try {
        const result = await FileService.updateFile(file_id, updates);
        return { success: true, data: { updatedCount: result } };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  ipcMain.handle(
    FILE_EVENTS.DELETE,
    async (
      _event,
      file_id: string,
    ): Promise<IPCResponse<DeleteFileResponse>> => {
      try {
        const result = await FileService.deleteFile(file_id);
        return { success: true, data: { deleteCount: result } };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  ipcMain.handle(
    FILE_EVENTS.DELETE_BY_SUBJECT,
    async (
      _event,
      subject_id: string,
    ): Promise<IPCResponse<DeleteFileResponse>> => {
      try {
        const result = await FileService.deleteFilesBySubject(subject_id);
        return { success: true, data: { deleteCount: result } };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );
}
