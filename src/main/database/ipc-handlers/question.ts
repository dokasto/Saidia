import { ipcMain } from 'electron';
import QuestionService from '../services/question';
import { QUESTION_EVENTS } from '../../../constants/events';
import { IPCResponse } from '../../../types';
import {
  DeleteQuestionResponse,
  TQuestion,
  UpdateQuestionResponse,
  TGeneratedQuestion,
  TQuestionDifficulty,
  TQuestionType,
  QuestionUpdateData,
} from '../../../types/Question';

export default function setupQuestionHandlers() {
  ipcMain.handle(
    QUESTION_EVENTS.SAVE_QUESTIONS,
    async (
      _event,
      subjectId: string,
      questions: TGeneratedQuestion[],
      difficulty: TQuestionDifficulty,
      type: TQuestionType,
    ): Promise<IPCResponse> => {
      try {
        await QuestionService.saveQuestions(
          subjectId,
          questions,
          difficulty,
          type,
        );
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  ipcMain.handle(
    QUESTION_EVENTS.GET_ALL,
    async (
      _event,
      {
        subjectId,
        difficulty,
        type,
      }: {
        subjectId?: string;
        difficulty?: TQuestionDifficulty;
        type?: TQuestionType;
      } = {},
    ): Promise<IPCResponse<TQuestion[]>> => {
      try {
        const questions = await QuestionService.getQuestions(
          subjectId,
          difficulty,
          type,
        );
        return { success: true, data: questions };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  ipcMain.handle(
    QUESTION_EVENTS.GET_ONE,
    async (
      _event,
      question_id: string,
    ): Promise<IPCResponse<TQuestion | null>> => {
      try {
        const question = await QuestionService.findQuestion(question_id);
        return { success: true, data: question };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  ipcMain.handle(
    QUESTION_EVENTS.UPDATE,
    async (
      _event,
      question_id: string,
      updates: QuestionUpdateData,
    ): Promise<IPCResponse<UpdateQuestionResponse>> => {
      try {
        const result = await QuestionService.updateQuestion(
          question_id,
          updates,
        );
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
    QUESTION_EVENTS.DELETE,
    async (
      _event,
      question_id: string,
    ): Promise<IPCResponse<DeleteQuestionResponse>> => {
      try {
        const result = await QuestionService.deleteQuestion(question_id);
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
    QUESTION_EVENTS.DELETE_BY_SUBJECT,
    async (
      _event,
      subject_id: string,
    ): Promise<IPCResponse<DeleteQuestionResponse>> => {
      try {
        const result =
          await QuestionService.deleteQuestionsBySubject(subject_id);
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
