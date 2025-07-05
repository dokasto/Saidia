import { Sequelize } from 'sequelize';
import * as sqliteVec from 'sqlite-vec';
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

// Database path - will be in userData directory
const dbPath = app.isPackaged
  ? path.join(app.getPath('userData'), 'data.db')
  : path.join(__dirname, '../../../data.db');

// Create better-sqlite3 database instance with sqlite-vec
const sqlite3Database = new Database(dbPath);
sqliteVec.load(sqlite3Database);

// Enable foreign key constraints for SQLite
sqlite3Database.pragma('foreign_keys = ON');

// Initialize Sequelize with the sqlite-vec enabled database
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
  },
  dialectOptions: {
    // Enable foreign key constraints for Sequelize
    foreignKeys: true,
  },
});

// Access to the raw sqlite-vec enabled database for vector operations
export const vectorDb = sqlite3Database;

// Initialize database and models
export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Create the sqlite-vec virtual table for embeddings
    await createEmbeddingsTable();

    // Try to sync the database, but handle schema conflicts gracefully
    try {
      await sequelize.sync({ force: false });
      console.log('Database synchronized successfully.');
    } catch (syncError) {
      console.warn(
        'Database sync failed, this usually indicates corrupted data. Resetting database:',
        syncError,
      );

      // If sync fails, reset the database completely
      console.log('Resetting database due to schema conflicts...');
      await sequelize.sync({ force: true });

      // Recreate the embeddings table after reset
      await createEmbeddingsTable();

      console.log('Database reset and synchronized successfully.');
    }

    return sequelize;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Create the vec0 virtual table for embeddings
const createEmbeddingsTable = async () => {
  try {
    vectorDb.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS embeddings USING vec0(
        chunk_id TEXT PRIMARY KEY,
        subject_id TEXT,
        file_id TEXT,
        chunk_index INTEGER,
        text TEXT,
        embedding float[384]
      )
    `);

    console.log('Embeddings virtual table created successfully.');
  } catch (error) {
    console.error('Error creating embeddings virtual table:', error);
    throw error;
  }
};
