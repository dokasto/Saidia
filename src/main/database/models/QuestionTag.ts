import { DataTypes, Model } from 'sequelize';
import Connection from '../connection';

interface QuestionTagAttributes {
  question_id: string;
  tag_id: number;
}

export class QuestionTag
  extends Model<QuestionTagAttributes>
  implements QuestionTagAttributes
{
  public question_id!: string;
  public tag_id!: number;
}

QuestionTag.init(
  {
    question_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'question_id',
      },
      onDelete: 'CASCADE',
    },
    tag_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tags',
        key: 'tag_id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize: Connection.sequelizeInstance,
    modelName: 'QuestionTag',
    tableName: 'question_tags',
    timestamps: false,
    indexes: [
      {
        fields: ['tag_id'],
      },
    ],
  },
);
