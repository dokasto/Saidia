import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config';

interface QuestionAttributes {
  question_id: string;
  subject_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  content: string;
  options_json: string;
  created_at: Date;
}

interface QuestionCreationAttributes
  extends Optional<QuestionAttributes, 'created_at'> {}

export class Question
  extends Model<QuestionAttributes, QuestionCreationAttributes>
  implements QuestionAttributes
{
  public question_id!: string;
  public subject_id!: string;
  public difficulty!: 'easy' | 'medium' | 'hard';
  public content!: string;
  public options_json!: string;
  public created_at!: Date;

  // Associations
  public readonly subject?: any;
  public readonly tags?: any[];
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
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    options_json: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
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
