export const QuestionDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export type QuestionDifficulty =
  (typeof QuestionDifficulty)[keyof typeof QuestionDifficulty];

export const QuestionType = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  FILL_IN_THE_BLANK: 'fill_in_the_blank',
} as const;

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export interface GenerateQuestionOptions {
  difficulty: QuestionDifficulty;
  count: number;
  type: QuestionType;
}

export interface GenerateQuestionsResponse {
  question: string;
  choices?: string[];
  answer?: number;
}
