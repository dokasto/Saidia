import { QuestionDifficulty, QuestionType } from '../constants/misc';

export type TQuestionDifficulty =
  (typeof QuestionDifficulty)[keyof typeof QuestionDifficulty];

export type TQuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export type DeleteQuestionResponse = {
  deleteCount: boolean;
};

export interface UpdateQuestionResponse {
  updatedCount: boolean;
}

export interface TQuestion {
  question_id: string;
  subject_id: string;
  difficulty: TQuestionDifficulty;
  type: TQuestionType;
  title: string;
  options?: string[];
  answer?: number;
  created_at: Date;
}

export interface GenerateQuestionOptions {
  count: number;
  difficulty: TQuestionDifficulty;
  type: TQuestionType;
}
