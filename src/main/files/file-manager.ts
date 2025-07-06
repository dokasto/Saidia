import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as https from 'https';
import * as http from 'http';
import * as zlib from 'zlib';
import { URL } from 'url';
import parseDocx from './parse-docx';
import parseMd from './parse-md';
import { Section } from './parse-html';
import parseOdt from './parse-odt';
import parsePdf from './parse-pdf';
import parseTxt from './parse-text';
import LLMService from '../llm/LLM-Service';

const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

const DOWNLOAD_TIMEOUT = 43200000; // 12 hours in milliseconds

export default class FileManager {
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

  static async loadFile(filePath: string): Promise<Section[]> {
    const fileExtension = path.extname(filePath).toLowerCase();
    switch (fileExtension) {
      case '.docx':
        const docx = await readFile(filePath);
        return await parseDocx(docx);
      case '.md':
        const markdown = await readFile(filePath, 'utf-8');
        return parseMd(markdown);
      case '.odt':
        return await parseOdt(filePath);
      case '.pdf':
        return await parsePdf(filePath);
      default:
        // just try to parse it as a text file
        const rawText = await readFile(filePath, 'utf-8');
        return parseTxt(rawText);
    }
  }

  static async embed(doc: Section[]): Promise<number[][]> {
    const lines: string[] = doc.flatMap((section) => section.content);
    const result = await LLMService.createEmbedding(lines);
    if (result.success && result.embeddings) {
      return result.embeddings;
    } else {
      console.error('Failed to create embedding:', result.error);
      return [];
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
   * Get the downloads directory path
   */
  static getDownloadsPath(): string {
    if (!this.baseStoragePath) {
      throw new Error('FileManager not initialized');
    }
    return path.join(this.baseStoragePath, 'appDownloads');
  }

  /**
   * Perform the actual download with progress monitoring
   */
  private static async performDownload(
    url: string,
    filePath: string,
    onProgress?: (progress: {
      downloaded: number;
      total: number;
      percentage: number;
    }) => void,
    maxRedirects: number = 5,
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      console.log(`Starting download: ${url} -> ${filePath}`);

      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1',
        },
      };

      const request = client.get(url, options, (response) => {
        console.log(
          `Download response status: ${response.statusCode} for ${url}`,
        );

        // Handle redirects
        if (
          response.statusCode === 301 ||
          response.statusCode === 302 ||
          response.statusCode === 307 ||
          response.statusCode === 308
        ) {
          const redirectUrl = response.headers.location;
          if (redirectUrl && maxRedirects > 0) {
            console.log(`Following redirect to: ${redirectUrl}`);
            return this.performDownload(
              redirectUrl,
              filePath,
              onProgress,
              maxRedirects - 1,
            )
              .then(resolve)
              .catch((error) =>
                resolve({ success: false, error: error.message }),
              );
          } else {
            resolve({
              success: false,
              error:
                maxRedirects <= 0
                  ? 'Too many redirects'
                  : 'Redirect without location header',
            });
            return;
          }
        }

        if (response.statusCode !== 200) {
          resolve({
            success: false,
            error: `HTTP ${response.statusCode}: ${response.statusMessage}`,
          });
          return;
        }

        const total = parseInt(response.headers['content-length'] || '0', 10);
        let downloaded = 0;

        const fileStream = fs.createWriteStream(filePath);

        // Handle compressed responses
        let responseStream: NodeJS.ReadableStream = response;
        const encoding = response.headers['content-encoding'];

        if (encoding === 'gzip') {
          responseStream = response.pipe(zlib.createGunzip());
        } else if (encoding === 'deflate') {
          responseStream = response.pipe(zlib.createInflate());
        } else if (encoding === 'br') {
          responseStream = response.pipe(zlib.createBrotliDecompress());
        }

        // Track progress on the original response stream
        response.on('data', (chunk) => {
          downloaded += chunk.length;
          if (onProgress && total > 0) {
            onProgress({
              downloaded,
              total,
              percentage: Math.round((downloaded / total) * 100),
            });
          }
        });

        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`Download completed successfully: ${url} -> ${filePath}`);
          resolve({ success: true });
        });

        fileStream.on('error', (error) => {
          console.error(`File stream error for ${url}:`, error);
          resolve({
            success: false,
            error: error.message,
          });
        });

        responseStream.pipe(fileStream);
      });

      request.on('error', (error) => {
        console.error(`Download request error for ${url}:`, error);
        resolve({
          success: false,
          error: error.message,
        });
      });

      request.setTimeout(DOWNLOAD_TIMEOUT, () => {
        console.error(
          `Download timeout for ${url} after ${DOWNLOAD_TIMEOUT}ms`,
        );
        request.destroy();
        resolve({
          success: false,
          error: 'Download timeout',
        });
      });
    });
  }

  /**
   * Get list of downloaded files (including files in subfolders)
   */
  static async getDownloadedFiles(): Promise<
    Array<{
      filename: string;
      filePath: string;
      size: number;
      createdAt: Date;
      folderName?: string;
    }>
  > {
    if (!this.baseStoragePath) {
      return [];
    }

    try {
      const downloadsPath = this.getDownloadsPath();
      const allFiles: Array<{
        filename: string;
        filePath: string;
        size: number;
        createdAt: Date;
        folderName?: string;
      }> = [];

      // Recursive function to scan directories
      const scanDirectory = async (
        dirPath: string,
        relativePath: string = '',
      ) => {
        const items = await fs.promises.readdir(dirPath);

        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = await stat(itemPath);

          if (stats.isDirectory()) {
            // Recursively scan subdirectory
            const subFolderPath = relativePath
              ? path.join(relativePath, item)
              : item;
            await scanDirectory(itemPath, subFolderPath);
          } else {
            // It's a file
            allFiles.push({
              filename: item,
              filePath: itemPath,
              size: stats.size,
              createdAt: stats.birthtime,
              folderName: relativePath || undefined,
            });
          }
        }
      };

      await scanDirectory(downloadsPath);

      return allFiles.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    } catch (error) {
      console.error('Failed to get downloaded files:', error);
      return [];
    }
  }

  /**
   * Download files from URLs with progress monitoring
   * @param urls - Array of URLs to download (must contain at least one URL)
   * @param onProgress - Progress callback function for individual downloads
   * @param folderName - Optional folder name to organize downloads (creates subdirectory)
   * @returns Array of download results
   */
  static async downloadFiles(
    urls: string[],
    onProgress?: (progress: {
      downloadId: string;
      url: string;
      downloaded: number;
      total: number;
      percentage: number;
      filename?: string;
      status: 'starting' | 'downloading' | 'completed' | 'error';
    }) => void,
    folderName?: string,
  ): Promise<
    Array<{
      url: string;
      downloadId: string;
      filePath: string;
      filename: string;
      size: number;
      success: boolean;
      error?: string;
    }>
  > {
    console.log(`=== Starting download of ${urls.length} files ===`);
    console.log('URLs:', urls);

    if (!this.baseStoragePath) {
      throw new Error('FileManager not initialized');
    }

    if (!urls || urls.length === 0) {
      throw new Error('At least one URL must be provided');
    }

    // Create downloads directory (with optional subfolder)
    const baseDownloadsPath = this.getDownloadsPath();
    const downloadsPath = folderName
      ? path.join(baseDownloadsPath, folderName)
      : baseDownloadsPath;

    console.log(`Creating downloads directory: ${downloadsPath}`);
    if (folderName) {
      console.log(`Using custom folder: ${folderName}`);
    }

    try {
      await mkdir(downloadsPath, { recursive: true });
      console.log(`Downloads directory created successfully: ${downloadsPath}`);
    } catch (error) {
      console.error(
        `Failed to create downloads directory: ${downloadsPath}`,
        error,
      );
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create downloads directory: ${errorMessage}`);
    }

    // Generate download IDs for each URL
    const downloadTasks = urls.map((url, index) => ({
      url,
      downloadId: `download_${Date.now()}_${index}`,
    }));

    // Download all files concurrently
    const downloadPromises = downloadTasks.map(async ({ url, downloadId }) => {
      try {
        // Notify progress that download is starting
        onProgress?.({
          downloadId,
          url,
          downloaded: 0,
          total: 0,
          percentage: 0,
          status: 'starting',
        });

        // Parse URL and extract filename
        let urlObj;
        try {
          urlObj = new URL(url);
        } catch (error) {
          console.error(`Invalid URL: ${url}`, error);
          throw new Error(`Invalid URL: ${url}`);
        }

        const urlPath = urlObj.pathname;
        let filename = path.basename(urlPath);

        // If no filename in URL, generate one
        if (!filename || filename === '/' || filename === '') {
          const timestamp = Date.now();
          const extension = urlPath.includes('.') ? path.extname(urlPath) : '';
          filename = `download_${timestamp}${extension}`;
        }

        // Remove query parameters from filename if present
        filename = filename.split('?')[0];

        console.log(`Extracted filename: "${filename}" from URL: ${url}`);

        // Generate unique filename to avoid conflicts
        const fileExtension = path.extname(filename);
        const baseName = path.basename(filename, fileExtension);
        const timestamp = Date.now();
        const uniqueFilename = `${baseName}_${timestamp}${fileExtension}`;

        const filePath = path.join(downloadsPath, uniqueFilename);

        // Download the file
        const result = await this.performDownload(url, filePath, (progress) => {
          onProgress?.({
            downloadId,
            url,
            downloaded: progress.downloaded,
            total: progress.total,
            percentage: progress.percentage,
            filename: uniqueFilename,
            status: 'downloading',
          });
        });

        if (result.success) {
          // Get file stats
          const stats = await stat(filePath);

          // Notify completion
          onProgress?.({
            downloadId,
            url,
            downloaded: stats.size,
            total: stats.size,
            percentage: 100,
            filename: uniqueFilename,
            status: 'completed',
          });

          return {
            url,
            downloadId,
            filePath,
            filename: uniqueFilename,
            size: stats.size,
            success: true,
          };
        } else {
          // Notify error
          onProgress?.({
            downloadId,
            url,
            downloaded: 0,
            total: 0,
            percentage: 0,
            status: 'error',
          });

          return {
            url,
            downloadId,
            filePath: '',
            filename: '',
            size: 0,
            success: false,
            error: result.error,
          };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Notify error
        onProgress?.({
          downloadId,
          url,
          downloaded: 0,
          total: 0,
          percentage: 0,
          status: 'error',
        });

        return {
          url,
          downloadId,
          filePath: '',
          filename: '',
          size: 0,
          success: false,
          error: errorMessage,
        };
      }
    });

    return Promise.all(downloadPromises);
  }

  /**
   * Delete a downloaded file
   */
  static async deleteDownloadedFile(filename: string): Promise<boolean> {
    if (!this.baseStoragePath) {
      return false;
    }

    try {
      const downloadsPath = this.getDownloadsPath();
      const filePath = path.join(downloadsPath, filename);
      await unlink(filePath);
      return true;
    } catch (error) {
      console.error('Failed to delete downloaded file:', error);
      return false;
    }
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
