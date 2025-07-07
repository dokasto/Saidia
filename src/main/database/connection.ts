import { Sequelize } from 'sequelize';
import * as sqliteVec from 'sqlite-vec';
import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { ensureDirectory } from '../util';
import * as fs from 'fs';

class Connection {
  vectorDbInstance: DatabaseType;
  sequelizeInstance: Sequelize;
  private initialized: boolean = false;

  constructor() {
    const dbPath = path.join(
      app.getPath('userData'),
      'files',
      'database',
      'database.db',
    );

    this.ensureDBDirectory(dbPath);

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
  }

  async initDatabase() {
    if (this.initialized) {
      return;
    }

    try {
      await this.sequelizeInstance.authenticate();
      console.log('Database connection established successfully.');

      // Create the sqlite-vec virtual table for embeddings
      this.vectorDbInstance.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS embeddings USING vec0(
          chunk_id TEXT PRIMARY KEY,
          subject_id TEXT,
          file_id TEXT,
          text TEXT,
          embedding float[768]
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

      this.initialized = true;
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private ensureDBDirectory(dirPath: string): void {
    const fullDirPath = path.dirname(dirPath);
    if (!fs.existsSync(fullDirPath)) {
      try {
        fs.mkdirSync(fullDirPath, { recursive: true });
        console.log('Directory created:', fullDirPath);
      } catch (error) {
        console.error('Failed to create directory:', error);
        throw error;
      }
    }
  }
}

export default new Connection();
