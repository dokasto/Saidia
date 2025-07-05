import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config';

interface SubjectAttributes {
  subject_id: string;
  name: string;
}

interface SubjectCreationAttributes
  extends Optional<SubjectAttributes, never> {}

export class Subject
  extends Model<SubjectAttributes, SubjectCreationAttributes>
  implements SubjectAttributes
{
  public subject_id!: string;
  public name!: string;

  // Associations
  public readonly files?: any[];
  public readonly questions?: any[];
}

Subject.init(
  {
    subject_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Subject',
    tableName: 'subjects',
    timestamps: false,
  },
);
