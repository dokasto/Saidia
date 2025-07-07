import { DataTypes, Model, Optional } from 'sequelize';
import Connection from '../connection';

interface TagAttributes {
  tag_id: number;
  name: string;
}

interface TagCreationAttributes extends Optional<TagAttributes, 'tag_id'> {}

export class Tag
  extends Model<TagAttributes, TagCreationAttributes>
  implements TagAttributes
{
  public tag_id!: number;
  public name!: string;

  // Associations
  public readonly questions?: any[];
}

Tag.init(
  {
    tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize: Connection.sequelizeInstance,
    modelName: 'Tag',
    tableName: 'tags',
    timestamps: false,
  },
);
