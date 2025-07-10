export const QuestionDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export const QuestionType = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  FILL_IN_THE_BLANK: 'fill_in_the_blank',
} as const;

export type QuestionDifficulty =
  (typeof QuestionDifficulty)[keyof typeof QuestionDifficulty];

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export type DeleteQuestionResponse = {
  deleteCount: boolean;
};

export interface UpdateQuestionResponse {
  updatedCount: boolean;
}

export interface TQuestion {
  question_id: string;
  subject_id: string;
  difficulty: QuestionDifficulty;
  type: QuestionType;
  title: string;
  options?: string[];
  answer?: number;
  created_at: Date;
}
