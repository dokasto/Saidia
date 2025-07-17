import crypto from 'crypto';
import QuestionModel from '../models/Question';
import {
  TQuestionDifficulty,
  TQuestionType,
  TQuestion,
  TGeneratedQuestion,
  QuestionUpdateData,
} from '../../../types/Question';

export default class QuestionService {
  static async saveQuestions(
    subject_id: string,
    questions: TGeneratedQuestion[],
    difficulty: TQuestionDifficulty,
    type: TQuestionType,
  ): Promise<TQuestion[]> {
    const createdQuestions = await QuestionModel.bulkCreate(
      questions.map((q) => ({
        question_id: crypto.randomUUID(),
        subject_id,
        difficulty,
        type,
        title: q.question,
        options: q.choices ? JSON.stringify(q.choices) : undefined,
        answer: q.answer,
      })),
    );

    return createdQuestions.map((question) => {
      const json = question.toJSON();
      return {
        ...json,
        options: json.options ? JSON.parse(json.options) : undefined,
      };
    });
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
    updates: QuestionUpdateData,
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
    difficulty?: TQuestionDifficulty,
    type?: TQuestionType,
  ): Promise<TQuestion[]> {
    const where: any = {};
    if (subject_id) where.subject_id = subject_id;
    if (difficulty) where.difficulty = difficulty;
    if (type) where.type = type;

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
