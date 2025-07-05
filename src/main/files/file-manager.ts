import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

export class FileManager {
  private static baseStoragePath: string;

  /**
   * Initialize the file manager and create necessary directories
   */
  static async initialize(): Promise<void> {
    try {
      console.log('=== FileManager Initialization Starting ===');

      // Get the user data directory (persists across app restarts)
      const userDataPath = app.getPath('userData');
      this.baseStoragePath = path.join(userDataPath, 'files');

      console.log('User data path:', userDataPath);
      console.log('Base storage path:', this.baseStoragePath);

      // Create the base storage directory if it doesn't exist
      await mkdir(this.baseStoragePath, { recursive: true });
      console.log('Storage directory created successfully');

      // Verify the directory was created
      console.log('Verifying storage directory...');
      const stats = await stat(this.baseStoragePath);
      if (!stats.isDirectory()) {
        throw new Error('Failed to create storage directory - not a directory');
      }

      console.log('Storage directory verification passed');
      console.log('Directory stats:', {
        isDirectory: stats.isDirectory(),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      });

      console.log('=== FileManager Initialization Complete ===');
    } catch (error) {
      console.error('=== FileManager Initialization Failed ===');
      console.error('Error details:', error);
      this.baseStoragePath = ''; // Reset on failure
      throw error;
    }
  }

  /**
   * Store a file in the app's storage directory
   * @param sourceFilePath - Original file path (from file upload)
   * @param subjectId - Subject ID to organize files
   * @param originalFilename - Original filename
   * @returns Object with stored file info
   */
  static async storeFile(
    sourceFilePath: string,
    subjectId: string,
    originalFilename: string,
  ): Promise<{
    storedPath: string;
    relativePath: string;
    filename: string;
    size: number;
  }> {
    if (!this.baseStoragePath) {
      throw new Error('FileManager not initialized');
    }

    // Create subject-specific directory
    const subjectDir = path.join(this.baseStoragePath, subjectId);
    await mkdir(subjectDir, { recursive: true });

    // Generate unique filename to avoid conflicts
    const fileExtension = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, fileExtension);
    const timestamp = Date.now();
    const uniqueFilename = `${baseName}_${timestamp}${fileExtension}`;

    // Full path where the file will be stored
    const storedPath = path.join(subjectDir, uniqueFilename);

    // Relative path for database storage
    const relativePath = path.join(subjectId, uniqueFilename);

    try {
      // Copy the file to our storage directory
      await copyFile(sourceFilePath, storedPath);

      // Get file stats
      const stats = await stat(storedPath);

      return {
        storedPath,
        relativePath,
        filename: originalFilename,
        size: stats.size,
      };
    } catch (error) {
      console.error('Failed to store file:', error);
      throw error;
    }
  }

  /**
   * Delete a stored file
   * @param relativePath - Relative path of the file to delete
   */
  static async deleteFile(relativePath: string): Promise<void> {
    if (!this.baseStoragePath) {
      throw new Error('FileManager not initialized');
    }

    const fullPath = path.join(this.baseStoragePath, relativePath);

    try {
      await unlink(fullPath);
      console.log('File deleted:', fullPath);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * Get the absolute path of a stored file
   * @param relativePath - Relative path stored in database
   * @returns Absolute path to the file
   */
  static getAbsolutePath(relativePath: string): string {
    if (!this.baseStoragePath) {
      throw new Error('FileManager not initialized');
    }

    return path.join(this.baseStoragePath, relativePath);
  }

  /**
   * Check if a file exists
   * @param relativePath - Relative path to check
   * @returns True if file exists
   */
  static async fileExists(relativePath: string): Promise<boolean> {
    if (!this.baseStoragePath) {
      return false;
    }

    const fullPath = path.join(this.baseStoragePath, relativePath);

    try {
      await stat(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file info
   * @param relativePath - Relative path of the file
   * @returns File stats and info
   */
  static async getFileInfo(relativePath: string): Promise<{
    size: number;
    createdAt: Date;
    modifiedAt: Date;
    exists: boolean;
  }> {
    if (!this.baseStoragePath) {
      throw new Error('FileManager not initialized');
    }

    const fullPath = path.join(this.baseStoragePath, relativePath);

    try {
      const stats = await stat(fullPath);
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        exists: true,
      };
    } catch {
      return {
        size: 0,
        createdAt: new Date(),
        modifiedAt: new Date(),
        exists: false,
      };
    }
  }

  /**
   * Get the base storage path
   */
  static getStoragePath(): string {
    return this.baseStoragePath;
  }

  /**
   * Clean up files for a deleted subject
   * @param subjectId - Subject ID to clean up
   */
  static async cleanupSubjectFiles(subjectId: string): Promise<void> {
    if (!this.baseStoragePath) {
      return;
    }

    const subjectDir = path.join(this.baseStoragePath, subjectId);

    try {
      // Remove the entire subject directory
      await fs.promises.rmdir(subjectDir, { recursive: true });
      console.log('Subject directory cleaned up:', subjectDir);
    } catch (error) {
      console.error('Failed to cleanup subject files:', error);
    }
  }
}
