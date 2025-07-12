/* eslint-disable @typescript-eslint/no-unused-vars */
import { ipcMain } from 'electron';
import crypto from 'crypto';
import SubjectService from '../services/subject';
import { SUBJECT_EVENTS } from '../../../constants/events';
import {
  IPCResponse,
  SubjectResponse,
  DeleteSubjectResponse,
} from '../../../types';

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
      subjectId: string,
    ): Promise<IPCResponse<SubjectResponse | null>> => {
      try {
        const subject = await SubjectService.getSubject(subjectId);
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
    async (_event, subjectId: string, updates: any): Promise<IPCResponse> => {
      try {
        const result = await SubjectService.updateSubject(subjectId, updates);
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
      subjectId: string,
    ): Promise<IPCResponse<DeleteSubjectResponse>> => {
      try {
        const result = await SubjectService.deleteSubject(subjectId);
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
