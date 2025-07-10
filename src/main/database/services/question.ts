import { Question as QuestionModel } from '../models';
import {
  QuestionDifficulty,
  QuestionType,
  TQuestion,
} from '../../../types/Question';
import crypto from 'crypto';

export default class QuestionService {
  static async createQuestion(
    subject_id: string,
    difficulty: QuestionDifficulty,
    type: QuestionType,
    title: string,
    options?: string[],
    answer?: number,
  ): Promise<TQuestion> {
    const question = await QuestionModel.create({
      question_id: crypto.randomUUID(),
      subject_id,
      difficulty,
      type,
      title,
      options: options ? JSON.stringify(options) : undefined,
      answer,
    });

    const json = question.toJSON();
    return {
      ...json,
      options: json.options ? JSON.parse(json.options) : undefined,
    };
  }

  static async findQuestionsBySubject(
    subject_id: string,
  ): Promise<TQuestion[]> {
    const questions = await QuestionModel.findAll({
      where: { subject_id },
    });
    return questions.map((question) => {
      const json = question.toJSON();
      return {
        ...json,
        options: json.options ? JSON.parse(json.options) : undefined,
      };
    });
  }

  static async findQuestion(question_id: string): Promise<TQuestion | null> {
    const question = await QuestionModel.findByPk(question_id);
    if (!question) return null;

    const json = question.toJSON();
    return {
      ...json,
      options: json.options ? JSON.parse(json.options) : undefined,
    };
  }

  static async updateQuestion(
    question_id: string,
    updates: Partial<{
      difficulty: QuestionDifficulty;
      type: QuestionType;
      title: string;
      options?: string[];
      answer?: number;
    }>,
  ): Promise<boolean> {
    const updateData: any = { ...updates };
    if (updates.options) {
      updateData.options = JSON.stringify(updates.options);
    }

    const [affectedCount] = await QuestionModel.update(updateData, {
      where: { question_id },
    });
    return affectedCount > 0;
  }

  static async getQuestions(
    subject_id?: string,
    difficulty?: QuestionDifficulty,
  ): Promise<TQuestion[]> {
    const where: any = {};
    if (subject_id) where.subject_id = subject_id;
    if (difficulty) where.difficulty = difficulty;

    const questions = await QuestionModel.findAll({ where });
    return questions.map((question) => {
      const json = question.toJSON();
      return {
        ...json,
        options: json.options ? JSON.parse(json.options) : undefined,
      };
    });
  }

  static async deleteQuestion(question_id: string): Promise<boolean> {
    const deletedCount = await QuestionModel.destroy({
      where: { question_id },
    });
    return deletedCount > 0;
  }

  static async deleteQuestionsBySubject(subject_id: string): Promise<boolean> {
    const deletedCount = await QuestionModel.destroy({
      where: { subject_id },
    });
    return deletedCount > 0;
  }
}
