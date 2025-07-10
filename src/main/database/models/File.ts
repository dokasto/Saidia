import { DataTypes, Model, Optional } from 'sequelize';
import Connection from '../connection';
import { Subject } from './Subject';

interface FileAttributes {
  file_id: string;
  subject_id: string;
  filename: string;
  filepath: string;
}

interface FileCreationAttributes extends Optional<FileAttributes, never> {}

export class File
  extends Model<FileAttributes, FileCreationAttributes>
  implements FileAttributes
{
  public file_id!: string;
  public subject_id!: string;
  public filename!: string;
  public filepath!: string;

  // Associations
  public readonly subject?: Subject;
}

File.init(
  {
    file_id: {
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
    filename: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    filepath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: Connection.sequelizeInstance,
    modelName: 'File',
    tableName: 'files',
    timestamps: false,
  },
);
