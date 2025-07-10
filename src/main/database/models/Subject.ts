import { DataTypes, Model, Optional } from 'sequelize';
import Connection from '../connection';
import { File } from './File';
import { Question } from './Question';

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
  public readonly files?: File[];
  public readonly questions?: Question[];
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
    sequelize: Connection.sequelizeInstance,
    modelName: 'Subject',
    tableName: 'subjects',
    timestamps: false,
  },
);
