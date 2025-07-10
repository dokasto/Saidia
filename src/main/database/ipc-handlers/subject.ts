import { ipcMain } from 'electron';
import SubjectService from '../services/subject';
import { SUBJECT_EVENTS } from '../../../constants/events';
import { IPCResponse } from '../../setup-ipc-handlers';
import { SubjectResponse } from '../../../types/Subject';
import { DeleteSubjectResponse } from '../../../types/Subject';
import crypto from 'crypto';

export default function setupSubjectHandlers() {
  ipcMain.handle(
    SUBJECT_EVENTS.CREATE,
    async (_event, name: string): Promise<IPCResponse<SubjectResponse>> => {
      try {
        const subject = await SubjectService.createSubject(
          crypto.randomUUID(),
          name,
        );
        return { success: true, data: subject };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  ipcMain.handle(
    SUBJECT_EVENTS.GET_ALL,
    async (_event): Promise<IPCResponse<SubjectResponse[]>> => {
      try {
        const subjects = await SubjectService.getSubjects();
        return { success: true, data: subjects };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  ipcMain.handle(
    SUBJECT_EVENTS.GET_ONE,
    async (
      _event,
      subject_id: string,
    ): Promise<IPCResponse<SubjectResponse | null>> => {
      try {
        const subject = await SubjectService.getSubject(subject_id);
        return { success: true, data: subject };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  ipcMain.handle(
    SUBJECT_EVENTS.UPDATE,
    async (_event, subject_id: string, updates: any): Promise<IPCResponse> => {
      try {
        const result = await SubjectService.updateSubject(subject_id, updates);
        return { success: result };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  ipcMain.handle(
    SUBJECT_EVENTS.DELETE,
    async (
      _event,
      subject_id: string,
    ): Promise<IPCResponse<DeleteSubjectResponse>> => {
      try {
        const result = await SubjectService.deleteSubject(subject_id);
        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );
}
