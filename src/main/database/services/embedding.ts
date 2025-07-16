import { Embedding as EmbeddingModel } from '../models';
import { TEmbedding } from '../../../types/Embedding';

export default class EmbeddingService {
  static async addEmbedding(
    subject_id: string,
    file_id: string,
    text: string,
    embedding: number[],
  ): Promise<TEmbedding> {
    return EmbeddingModel.insertEmbedding(subject_id, file_id, text, embedding);
  }

  static async searchSimilar(
    queryEmbedding: number[],
    limit: number,
    subject_id?: string,
  ): Promise<TEmbedding[]> {
    return EmbeddingModel.searchSimilar(queryEmbedding, limit, subject_id);
  }

  static async getEmbeddingsByFile(file_id: string): Promise<TEmbedding[]> {
    return EmbeddingModel.getEmbeddingsByFile(file_id);
  }

  static async getEmbeddingsBySubject(
    subject_id: string,
  ): Promise<TEmbedding[]> {
    return EmbeddingModel.getEmbeddingsBySubject(subject_id);
  }

  static async deleteEmbeddingsByFile(file_id: string): Promise<void> {
    EmbeddingModel.deleteEmbeddingsByFile(file_id);
  }

  static async deleteEmbeddingsBySubject(subject_id: string): Promise<void> {
    EmbeddingModel.deleteEmbeddingsBySubject(subject_id);
  }
}
