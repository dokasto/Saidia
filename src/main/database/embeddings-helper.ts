import Connection from './connection';

/**
 * Helper functions for working with sqlite-vec embeddings
 * Uses the vectorDb (better-sqlite3) instance for direct vec0 virtual table operations
 */

export class EmbeddingsHelper {
  /**
   * Insert an embedding into the virtual table
   */
  static insertEmbedding(
    chunk_id: string,
    subject_id: string,
    file_id: string,
    text: string,
    embedding: number[],
  ): void {
    const stmt = Connection.vectorDbInstance.prepare(`
      INSERT INTO embeddings (chunk_id, subject_id, file_id, text, embedding)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Convert embedding array to Float32Array for sqlite-vec
    const embeddingFloat32 = new Float32Array(embedding);

    stmt.run(chunk_id, subject_id, file_id, text, embeddingFloat32);
  }

  /**
   * Search for similar embeddings using KNN
   */
  static searchSimilar(
    queryEmbedding: number[],
    limit: number = 10,
    subject_id?: string,
  ): any[] {
    const embeddingFloat32 = new Float32Array(queryEmbedding);

    let query = `
      SELECT
        chunk_id,
        subject_id,
        file_id,
        text,
        distance
      FROM embeddings
      WHERE embedding MATCH ?
    `;

    const params: any[] = [embeddingFloat32];

    if (subject_id) {
      query += ` AND subject_id = ?`;
      params.push(subject_id);
    }

    query += ` ORDER BY distance LIMIT ?`;
    params.push(limit);

    const stmt = Connection.vectorDbInstance.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Get embeddings by subject
   */
  static getEmbeddingsBySubject(subject_id: string): any[] {
    const stmt = Connection.vectorDbInstance.prepare(`
      SELECT * FROM embeddings WHERE subject_id = ?
    `);
    return stmt.all(subject_id);
  }

  /**
   * Get embeddings by file
   */
  static getEmbeddingsByFile(file_id: string): any[] {
    const stmt = Connection.vectorDbInstance.prepare(`
      SELECT * FROM embeddings WHERE file_id = ?
    `);
    return stmt.all(file_id);
  }

  /**
   * Delete embeddings by file
   */
  static deleteEmbeddingsByFile(file_id: string): void {
    const stmt = Connection.vectorDbInstance.prepare(`
      DELETE FROM embeddings WHERE file_id = ?
    `);
    stmt.run(file_id);
  }

  /**
   * Delete embeddings by subject
   */
  static deleteEmbeddingsBySubject(subject_id: string): void {
    const stmt = Connection.vectorDbInstance.prepare(`
      DELETE FROM embeddings WHERE subject_id = ?
    `);
    stmt.run(subject_id);
  }
}
