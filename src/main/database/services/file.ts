import FileManager from '../../files/file-manager';
import { FileResponse } from '../../../types/File';
import { File, Embedding } from '../models';

export default class FileService {
  static async createFile(
    fileId: string,
    subjectId: string,
    filename: string,
    filepath: string,
  ): Promise<FileResponse> {
    const file = await File.create({
      file_id: fileId,
      subject_id: subjectId,
      filename,
      filepath,
    });
    return file.toJSON();
  }

  static async getFiles(subjectId?: string): Promise<FileResponse[]> {
    const where = subjectId ? { subject_id: subjectId } : {};
    const files = await File.findAll({ where });
    return files.map((file) => file.toJSON());
  }

  static async getFile(fileId: string): Promise<FileResponse | null> {
    const file = await File.findByPk(fileId);
    return file ? file.toJSON() : null;
  }

  static async updateFile(
    fileId: string,
    updates: Partial<{ filename: string; filepath: string }>,
  ): Promise<boolean> {
    const [affectedCount] = await File.update(updates, {
      where: { file_id: fileId },
    });
    return affectedCount > 0;
  }

  static async deleteFile(fileId: string): Promise<boolean> {
    const file = await File.findByPk(fileId);
    if (file) {
      await FileManager.deleteFile(file.filepath);
    }

    Embedding.deleteEmbeddingsByFile(fileId);
    const deletedCount = await File.destroy({ where: { file_id: fileId } });
    return deletedCount > 0;
  }

  static async deleteFilesBySubject(subjectId: string): Promise<boolean> {
    await FileManager.cleanupSubjectFiles(subjectId);

    Embedding.deleteEmbeddingsBySubject(subjectId);

    const deletedCount = await File.destroy({
      where: { subject_id: subjectId },
    });
    return deletedCount > 0;
  }
}
