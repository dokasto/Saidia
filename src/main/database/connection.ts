import { Sequelize } from 'sequelize';
import * as sqliteVec from 'sqlite-vec';
import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { ensureDirectory } from '../util';

class Connection {
  vectorDbInstance: DatabaseType;
  sequelizeInstance: Sequelize;

  constructor() {
    const dbPath = path.join(
      app.getPath('userData'),
      'files',
      'database',
      'database.db',
    );

    ensureDirectory(dbPath);

    this.vectorDbInstance = new Database(dbPath);
    sqliteVec.load(this.vectorDbInstance);

    this.vectorDbInstance.pragma('foreign_keys = ON');

    this.sequelizeInstance = new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: console.log,
      define: {
        timestamps: true,
      },
      dialectOptions: {
        foreignKeys: true,
      },
    });

    this.initDatabase();
  }

  private async initDatabase() {
    try {
      await this.sequelizeInstance.authenticate();
      console.log('Database connection established successfully.');

      // Create the sqlite-vec virtual table for embeddings
      this.vectorDbInstance.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS embeddings USING vec0(
        chunk_id TEXT PRIMARY KEY,
        subject_id TEXT,
        file_id TEXT,
        chunk_index INTEGER,
        text TEXT,
        embedding float[384]
      )
    `);

      try {
        await this.sequelizeInstance.sync({ force: false });
        console.log('Database synchronized successfully.');
      } catch (syncError) {
        console.warn(
          'Database sync failed, this usually indicates corrupted data. Resetting database:',
          syncError,
        );

        console.log('Resetting database due to schema conflicts...');
        await this.sequelizeInstance.sync({ force: true });
        console.log('Database reset and synchronized successfully.');
      }
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }
  }
}

export default new Connection();
