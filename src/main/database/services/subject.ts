import { Subject, Embedding } from '../models';
import { SubjectResponse, DeleteSubjectResponse } from '../../../types/Subject';
import FileService from './file';
import QuestionService from './question';

export default class SubjectService {
  static async createSubject(
    subjectId: string,
    name: string,
  ): Promise<SubjectResponse> {
    const subject = await Subject.create({ subject_id: subjectId, name });
    return subject.toJSON();
  }

  static async getSubjects(): Promise<SubjectResponse[]> {
    const subjects = await Subject.findAll();
    return subjects.map((subject) => subject.toJSON());
  }

  static async getSubject(subjectId: string): Promise<SubjectResponse | null> {
    const subject = await Subject.findByPk(subjectId);
    return subject ? subject.toJSON() : null;
  }

  static async updateSubject(
    subjectId: string,
    updates: Partial<{ name: string }>,
  ): Promise<boolean> {
    const [affectedCount] = await Subject.update(updates, {
      where: { subject_id: subjectId },
    });
    return affectedCount > 0;
  }

  static async deleteSubject(
    subjectId: string,
  ): Promise<DeleteSubjectResponse> {
    const deletionErrors: string[] = [];

    try {
      await QuestionService.deleteQuestionsBySubject(subjectId);
    } catch (error) {
      deletionErrors.push(
        `Failed to delete questions: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      Embedding.deleteEmbeddingsBySubject(subjectId);
    } catch (error) {
      deletionErrors.push(
        `Failed to delete embeddings: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      await FileService.deleteFilesBySubject(subjectId);
    } catch (error) {
      deletionErrors.push(
        `Failed to delete files: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      await Subject.destroy({
        where: { subject_id: subjectId },
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
