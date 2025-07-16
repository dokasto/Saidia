import { DataTypes, Model, Optional } from 'sequelize';
import Connection from '../connection';
import { TQuestionDifficulty, TQuestionType } from '../../../types/Question';
import Subject from './Subject';
import { QuestionDifficulty, QuestionType } from '../../../constants/misc';

interface QuestionAttributes {
  question_id: string;
  subject_id: string;
  difficulty: TQuestionDifficulty;
  type: TQuestionType;
  title: string;
  options?: string;
  answer?: number;
  created_at: Date;
}

interface QuestionCreationAttributes
  extends Optional<QuestionAttributes, 'created_at' | 'options' | 'answer'> {}

export default class Question
  extends Model<QuestionAttributes, QuestionCreationAttributes>
  implements QuestionAttributes
{
  public question_id!: string;

  public subject_id!: string;

  public difficulty!: TQuestionDifficulty;

  public type!: TQuestionType;

  public title!: string;

  public options?: string;

  public answer?: number;

  public created_at!: Date;

  // Associations
  public readonly subject?: Subject;
}

Question.init(
  {
    question_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    subject_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'subject_id',
      },
      onDelete: 'CASCADE',
    },
    difficulty: {
      type: DataTypes.ENUM(...Object.values(QuestionDifficulty)),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(QuestionType)),
      allowNull: false,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    answer: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: Connection.sequelizeInstance,
    modelName: 'Question',
    tableName: 'questions',
    timestamps: false,
    indexes: [
      {
        fields: ['subject_id'],
      },
      {
        fields: ['difficulty'],
      },
    ],
  },
);
