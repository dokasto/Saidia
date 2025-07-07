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
import LLMService from '../llm/services';
import DatabaseService from '../database/services';
import { ensureDirectory, uniqueID } from '../util';
import { EmbeddingsHelper } from '../database/embeddings-helper';
import parseImage from './parse-image';
import { FILE_EXTENSIONS, IMAGE_EXTENSIONS } from '../../constants/misc';

const copyFile = promisify(fs.copyFile);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

const DOWNLOAD_TIMEOUT = 43200000; // 12 hours in milliseconds

export default class FileManager {
  static async uploadAndProcessFile(filePath: string, subjectId: string) {
    const originalFilename = path.basename(filePath);
    const doc = await FileManager.loadFile(filePath);

    if (doc.length < 1) {
      console.warn('File is empty, skipping...');
      return { success: false, error: 'File is empty' };
    }

    const storedFile = await FileManager.storeFile(
      filePath,
      subjectId,
      originalFilename,
    );

    if (storedFile == null) {
      return {
        success: false,
        error: 'Failed to store file',
      };
    }

    const fileId = storedFile.filename;

    try {
      const createFileResult = await DatabaseService.createFile(
        fileId,
        subjectId,
        originalFilename,
        storedFile.storedPath,
      );

      if (createFileResult == null) {
        console.warn('Failed to create file record in database');
        return {
          success: false,
          error: 'Failed to create file record in database',
        };
      }

      const embeddings: number[][] = await FileManager.embed(doc);

      for (let i = 0; i < embeddings.length; i++) {
        if (doc[i]?.content != null && doc[i].content.length > 0) {
          EmbeddingsHelper.insertEmbedding(
            uniqueID(),
            subjectId,
            fileId,
            doc[i].content[0],
            embeddings[i],
          );
        }
      }

      return {
        success: true,
        data: { size: fs.statSync(storedFile.storedPath).size },
      };
    } catch (error) {
      console.error('Failed to create file record in database:', error);
      await FileManager.deleteFile(storedFile.storedPath);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
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
        if (IMAGE_EXTENSIONS.map((ext) => `.${ext}`).includes(fileExtension)) {
          return await parseImage(filePath);
        }
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

  static async storeFile(
    sourceFilePath: string,
    subjectId: string,
    originalFilename: string,
  ): Promise<{ storedPath: string; filename: string } | null> {
    const subjectDir = await this.getSubjectDirectory(subjectId);
    const fileExtension = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, fileExtension);
    const uniqueFilename = `${baseName}_${uniqueID()}${fileExtension}`;
    const storedPath = path.join(subjectDir, uniqueFilename);

    // if (!fs.existsSync(storedPath))
    //   fs.mkdirSync(storedPath, { recursive: true });

    try {
      await copyFile(sourceFilePath, storedPath);
      console.info(`File stored at: ${storedPath}`);
      return { storedPath, filename: uniqueFilename };
    } catch (error) {
      console.error('Failed to store file:', error);
      return null;
    }
  }

  static async getSubjectDirectory(subjectId: string): Promise<string> {
    const dir = path.join(app.getPath('userData'), 'files', subjectId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  static async deleteFile(relativePath: string): Promise<void> {
    try {
      await unlink(relativePath);
      console.log('File deleted:', relativePath);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  static async getStoragePath(): Promise<string> {
    return app.getPath('userData');
  }

  static async getAbsolutePath(relativePath: string): Promise<string> {
    return path.resolve(relativePath);
  }

  static async fileExists(relativePath: string): Promise<boolean> {
    try {
      await stat(relativePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async getFileInfo(relativePath: string): Promise<{
    exists: boolean;
    size?: number;
    modified?: Date;
    isDirectory?: boolean;
  }> {
    try {
      const stats = await stat(relativePath);
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      return {
        exists: false,
      };
    }
  }

  static async checkFileManagerInitialization(): Promise<boolean> {
    try {
      // Check if the user data directory exists and is writable
      const userDataPath = app.getPath('userData');
      await stat(userDataPath);

      // Try to create a test file to verify write permissions
      const testPath = path.join(userDataPath, '.test_write_permission');
      await fs.promises.writeFile(testPath, 'test');
      await unlink(testPath);

      return true;
    } catch (error) {
      console.error('File manager initialization check failed:', error);
      return false;
    }
  }

  static async getSubjectFilePath(
    subjectId: string,
    filename: string,
  ): Promise<string> {
    const subjectDir = await this.getSubjectDirectory(subjectId);
    return path.join(subjectDir, filename);
  }

  static async listSubjectFiles(subjectId: string): Promise<string[]> {
    const subjectDir = await this.getSubjectDirectory(subjectId);
    try {
      const files = await fs.promises.readdir(subjectDir);
      return files.filter((file) => !file.startsWith('.')); // Exclude hidden files
    } catch (error) {
      console.error('Failed to list subject files:', error);
      return [];
    }
  }

  static async deleteSubjectFile(
    subjectId: string,
    filename: string,
  ): Promise<void> {
    const filePath = await this.getSubjectFilePath(subjectId, filename);
    await this.deleteFile(filePath);
  }

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

  static async downloadFiles(
    urls: string[],
    downloadsPath: string,
    onProgress?: (progress: {
      downloadId: string;
      url: string;
      downloaded: number;
      total: number;
      percentage: number;
      filename?: string;
      status: 'starting' | 'downloading' | 'completed' | 'error';
    }) => void,
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
    const downloadTasks = urls.map((url, index) => ({
      url,
      downloadId: `download_${Date.now()}_${index}`,
    }));

    const downloadPromises = downloadTasks.map(async ({ url, downloadId }) => {
      try {
        onProgress?.({
          downloadId,
          url,
          downloaded: 0,
          total: 0,
          percentage: 0,
          status: 'starting',
        });

        let urlObj;
        try {
          urlObj = new URL(url);
        } catch (error) {
          console.error(`Invalid URL: ${url}`, error);
          throw new Error(`Invalid URL: ${url}`);
        }

        const urlPath = urlObj.pathname;
        let filename = path.basename(urlPath);

        if (!filename || filename === '/' || filename === '') {
          const timestamp = Date.now();
          const extension = urlPath.includes('.') ? path.extname(urlPath) : '';
          filename = `download_${timestamp}${extension}`;
        }

        filename = filename.split('?')[0];

        console.log(`Extracted filename: "${filename}" from URL: ${url}`);

        const fileExtension = path.extname(filename);
        const baseName = path.basename(filename, fileExtension);
        const timestamp = Date.now();
        const uniqueFilename = `${baseName}_${timestamp}${fileExtension}`;

        const filePath = path.join(downloadsPath, uniqueFilename);

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
          const stats = await stat(filePath);

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

  static async cleanupSubjectFiles(subjectId: string): Promise<void> {
    const subjectDir = await this.getSubjectDirectory(subjectId);

    try {
      await fs.promises.rmdir(subjectDir, { recursive: true });
      console.log('Subject directory cleaned up:', subjectDir);
    } catch (error) {
      console.error('Failed to cleanup subject files:', error);
    }
  }
}
