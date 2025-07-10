import { File } from '../models';
import { Embedding } from '../models';
import FileManager from '../../files/file-manager';
import { FileResponse } from '../../../types/File';

export default class FileService {
  static async createFile(
    file_id: string,
    subject_id: string,
    filename: string,
    filepath: string,
  ): Promise<FileResponse> {
    const file = await File.create({ file_id, subject_id, filename, filepath });
    return file.toJSON();
  }

  static async getFiles(subject_id?: string): Promise<FileResponse[]> {
    const where = subject_id ? { subject_id } : {};
    const files = await File.findAll({ where });
    return files.map((file) => file.toJSON());
  }

  static async getFile(file_id: string): Promise<FileResponse | null> {
    const file = await File.findByPk(file_id);
    return file ? file.toJSON() : null;
  }

  static async updateFile(
    file_id: string,
    updates: Partial<{ filename: string; filepath: string }>,
  ): Promise<boolean> {
    const [affectedCount] = await File.update(updates, {
      where: { file_id },
    });
    return affectedCount > 0;
  }

  static async deleteFile(file_id: string): Promise<boolean> {
    // Get file info before deletion to clean up physical file
    const file = await File.findByPk(file_id);
    if (file) {
      // Delete physical file
      await FileManager.deleteFile(file.filepath);
    }

    // Delete associated embeddings
    Embedding.deleteEmbeddingsByFile(file_id);
    const deletedCount = await File.destroy({ where: { file_id } });
    return deletedCount > 0;
  }

  static async deleteFilesBySubject(subject_id: string): Promise<boolean> {
    // Get all files for the subject to clean up physical files
    const files = await File.findAll({ where: { subject_id } });

    // Delete physical files and associated embeddings
    for (const file of files) {
      await FileManager.deleteFile(file.filepath);
      Embedding.deleteEmbeddingsByFile(file.file_id);
    }

    // Delete all files for the subject
    const deletedCount = await File.destroy({ where: { subject_id } });
    return deletedCount > 0;
  }
}
