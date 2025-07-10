import Connection from '../connection';
import { TEmbedding } from '../../../types/Embedding';
import crypto from 'crypto';

export class Embedding {
  static insertEmbedding(
    subject_id: string,
    file_id: string,
    text: string,
    embedding: number[],
  ): TEmbedding {
    const chunk_id = crypto.randomUUID();
    const stmt = Connection.vectorDbInstance.prepare(`
      INSERT INTO embeddings (chunk_id, subject_id, file_id, text, embedding)
      VALUES (?, ?, ?, ?, ?)
    `);

    const embeddingFloat32 = new Float32Array(embedding);
    stmt.run(chunk_id, subject_id, file_id, text, embeddingFloat32);

    return {
      chunk_id,
      subject_id,
      file_id,
      text,
      embedding,
    };
  }

  static searchSimilar(
    queryEmbedding: number[],
    limit: number | null = 10,
    subject_id?: string,
  ): TEmbedding[] {
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

    query += ` ORDER BY distance`;

    if (limit && limit > 0) {
      query += ` LIMIT ?`;
      params.push(limit);
    }

    const stmt = Connection.vectorDbInstance.prepare(query);
    return stmt.all(...params) as TEmbedding[];
  }

  static getEmbeddingsBySubject(subject_id: string): TEmbedding[] {
    const stmt = Connection.vectorDbInstance.prepare(`
      SELECT * FROM embeddings WHERE subject_id = ?
    `);
    return stmt.all(subject_id) as TEmbedding[];
  }

  static getEmbeddingsByFile(file_id: string): TEmbedding[] {
    const stmt = Connection.vectorDbInstance.prepare(`
      SELECT * FROM embeddings WHERE file_id = ?
    `);
    return stmt.all(file_id) as TEmbedding[];
  }

  static deleteEmbeddingsByFile(file_id: string): void {
    const stmt = Connection.vectorDbInstance.prepare(`
      DELETE FROM embeddings WHERE file_id = ?
    `);
    stmt.run(file_id);
  }

  static deleteEmbeddingsBySubject(subject_id: string): void {
    const stmt = Connection.vectorDbInstance.prepare(`
      DELETE FROM embeddings WHERE subject_id = ?
    `);
    stmt.run(subject_id);
  }

  static retrieveRelevantChunksForSubject(subject_id: string): TEmbedding[] {
    const stmt = Connection.vectorDbInstance.prepare(`
      SELECT * FROM embeddings WHERE subject_id = ?
    `);
    return stmt.all(subject_id) as TEmbedding[];
  }
}
