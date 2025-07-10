import { Subject } from '../models';
import { Embedding } from '../models';
import FileManager from '../../files/file-manager';
import { SubjectResponse, DeleteSubjectResponse } from '../../../types/Subject';
import FileService from './file';
import QuestionService from './question';

export default class SubjectService {
  static async createSubject(
    subject_id: string,
    name: string,
  ): Promise<SubjectResponse> {
    const subject = await Subject.create({ subject_id, name });
    return subject.toJSON();
  }

  static async getSubjects(): Promise<SubjectResponse[]> {
    const subjects = await Subject.findAll();
    return subjects.map((subject) => subject.toJSON());
  }

  static async getSubject(subject_id: string): Promise<SubjectResponse | null> {
    const subject = await Subject.findByPk(subject_id);
    return subject ? subject.toJSON() : null;
  }

  static async updateSubject(
    subject_id: string,
    updates: Partial<{ name: string }>,
  ): Promise<boolean> {
    const [affectedCount] = await Subject.update(updates, {
      where: { subject_id },
    });
    return affectedCount > 0;
  }

  static async deleteSubject(
    subject_id: string,
  ): Promise<DeleteSubjectResponse> {
    const deletionErrors: string[] = [];

    try {
      await QuestionService.deleteQuestionsBySubject(subject_id);
    } catch (error) {
      deletionErrors.push(
        `Failed to delete questions: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      Embedding.deleteEmbeddingsBySubject(subject_id);
    } catch (error) {
      deletionErrors.push(
        `Failed to delete embeddings: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      await FileService.deleteFilesBySubject(subject_id);
    } catch (error) {
      deletionErrors.push(
        `Failed to delete files: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      await FileManager.cleanupSubjectFiles(subject_id);
    } catch (error) {
      deletionErrors.push(
        `Failed to cleanup subject files: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      await Subject.destroy({
        where: { subject_id },
      });

      return {
        deletionErrors: deletionErrors.length > 0 ? deletionErrors : undefined,
      };
    } catch (error) {
      deletionErrors.push(
        `Failed to delete subject: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        deletionErrors,
      };
    }
  }
}
