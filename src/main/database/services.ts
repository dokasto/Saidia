import { Subject, File, Question, Tag, QuestionTag } from './models';
import { EmbeddingsHelper } from './embeddings-helper';
import FileManager from '../files/file-manager';
import Connection from './connection';

export default class DatabaseService {
  // Subject operations
  static async createSubject(subject_id: string, name: string) {
    const subject = await Subject.create({ subject_id, name });
    return subject.toJSON();
  }

  static async getSubjects() {
    const subjects = await Subject.findAll({
      include: [
        { model: File, as: 'files' },
        { model: Question, as: 'questions' },
      ],
    });
    return subjects.map((subject) => subject.toJSON());
  }

  static async getSubject(subject_id: string) {
    const subject = await Subject.findByPk(subject_id, {
      include: [
        { model: File, as: 'files' },
        { model: Question, as: 'questions' },
      ],
    });
    return subject ? subject.toJSON() : null;
  }

  static async updateSubject(
    subject_id: string,
    updates: Partial<{ name: string }>,
  ) {
    const [affectedCount] = await Subject.update(updates, {
      where: { subject_id },
    });
    return affectedCount > 0;
  }

  static async deleteSubject(subject_id: string) {
    const sequelize = Connection.sequelizeInstance;
    const transaction = await sequelize.transaction();

    try {
      // Step 1: Delete embeddings first (from vector database)
      EmbeddingsHelper.deleteEmbeddingsBySubject(subject_id);

      // Step 2: Get all questions for this subject and delete their tag associations
      const questions = await Question.findAll({
        where: { subject_id },
        attributes: ['question_id'],
        transaction,
      });

      for (const question of questions) {
        // Delete question-tag associations
        await QuestionTag.destroy({
          where: { question_id: question.question_id },
          transaction,
        });
      }

      // Step 3: Delete all questions for this subject
      await Question.destroy({
        where: { subject_id },
        transaction,
      });

      // Step 4: Get all files for this subject and delete their physical files
      const files = await File.findAll({
        where: { subject_id },
        attributes: ['file_id', 'filepath'],
        transaction,
      });

      for (const file of files) {
        // Delete embeddings for this file
        EmbeddingsHelper.deleteEmbeddingsByFile(file.file_id);

        // Delete physical file
        try {
          await FileManager.deleteFile(file.filepath);
        } catch (error) {
          console.warn(
            `Failed to delete physical file ${file.filepath}:`,
            error,
          );
        }
      }

      // Step 5: Delete all files for this subject
      await File.destroy({
        where: { subject_id },
        transaction,
      });

      // Step 6: Finally delete the subject
      const deletedCount = await Subject.destroy({
        where: { subject_id },
        transaction,
      });

      // Commit the transaction
      await transaction.commit();

      // Step 7: Clean up subject directory (after successful database operations)
      await FileManager.cleanupSubjectFiles(subject_id);

      return deletedCount > 0;
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error('Error deleting subject:', error);
      throw error;
    }
  }

  // File operations
  static async createFile(
    file_id: string,
    subject_id: string,
    filename: string,
    filepath: string,
  ) {
    const file = await File.create({ file_id, subject_id, filename, filepath });
    return file.toJSON();
  }

  static async getFiles(subject_id?: string) {
    const where = subject_id ? { subject_id } : {};
    const files = await File.findAll({
      where,
      include: [{ model: Subject, as: 'subject' }],
    });
    return files.map((file) => file.toJSON());
  }

  static async getFile(file_id: string) {
    const file = await File.findByPk(file_id, {
      include: [{ model: Subject, as: 'subject' }],
    });
    return file ? file.toJSON() : null;
  }

  static async updateFile(
    file_id: string,
    updates: Partial<{ filename: string; filepath: string }>,
  ) {
    const [affectedCount] = await File.update(updates, {
      where: { file_id },
    });
    return affectedCount > 0;
  }

  static async deleteFile(file_id: string) {
    // Get file info before deletion to clean up physical file
    const file = await File.findByPk(file_id);
    if (file) {
      // Delete physical file
      await FileManager.deleteFile(file.filepath);
    }

    // Delete associated embeddings
    EmbeddingsHelper.deleteEmbeddingsByFile(file_id);
    return await File.destroy({ where: { file_id } });
  }

  // Question operations
  static async createQuestion(
    question_id: string,
    subject_id: string,
    difficulty: 'easy' | 'medium' | 'hard',
    content: string,
    options_json: string,
    tags?: string[],
  ) {
    const question = await Question.create({
      question_id,
      subject_id,
      difficulty,
      content,
      options_json,
    });

    // Add tags if provided
    if (tags && tags.length > 0) {
      await this.addTagsToQuestion(question_id, tags);
    }

    return question.toJSON();
  }

  static async getQuestions(subject_id?: string, difficulty?: string) {
    const where: any = {};
    if (subject_id) where.subject_id = subject_id;
    if (difficulty) where.difficulty = difficulty;

    const questions = await Question.findAll({
      where,
      include: [
        { model: Subject, as: 'subject' },
        { model: Tag, as: 'tags' },
      ],
    });
    return questions.map((question) => question.toJSON());
  }

  static async getQuestion(question_id: string) {
    const question = await Question.findByPk(question_id, {
      include: [
        { model: Subject, as: 'subject' },
        { model: Tag, as: 'tags' },
      ],
    });
    return question ? question.toJSON() : null;
  }

  static async updateQuestion(
    question_id: string,
    updates: Partial<{
      difficulty: 'easy' | 'medium' | 'hard';
      content: string;
      options_json: string;
    }>,
  ) {
    const [affectedCount] = await Question.update(updates, {
      where: { question_id },
    });
    return affectedCount > 0;
  }

  static async deleteQuestion(question_id: string) {
    return await Question.destroy({ where: { question_id } });
  }

  // Tag operations
  static async createTag(name: string) {
    const [tag, created] = await Tag.findOrCreate({ where: { name } });
    return { tag: tag.toJSON(), created };
  }

  static async getTags() {
    const tags = await Tag.findAll({
      include: [{ model: Question, as: 'questions' }],
    });
    return tags.map((tag) => tag.toJSON());
  }

  static async addTagsToQuestion(question_id: string, tagNames: string[]) {
    for (const tagName of tagNames) {
      const [tag] = await Tag.findOrCreate({ where: { name: tagName } });
      await QuestionTag.findOrCreate({
        where: { question_id, tag_id: tag.tag_id },
      });
    }
  }

  static async removeTagFromQuestion(question_id: string, tag_id: number) {
    return await QuestionTag.destroy({
      where: { question_id, tag_id },
    });
  }

  // Embedding operations
  static async addEmbedding(
    chunk_id: string,
    subject_id: string,
    file_id: string,
    text: string,
    embedding: number[],
  ) {
    EmbeddingsHelper.insertEmbedding(
      chunk_id,
      subject_id,
      file_id,
      text,
      embedding,
    );
  }

  static async searchSimilar(
    queryEmbedding: number[],
    limit: number = 10,
    subject_id?: string,
  ) {
    return EmbeddingsHelper.searchSimilar(queryEmbedding, limit, subject_id);
  }

  static async getEmbeddingsByFile(file_id: string) {
    return EmbeddingsHelper.getEmbeddingsByFile(file_id);
  }

  static async getEmbeddingsBySubject(subject_id: string) {
    return EmbeddingsHelper.getEmbeddingsBySubject(subject_id);
  }
}
