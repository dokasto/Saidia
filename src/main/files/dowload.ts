/* eslint-disable no-use-before-define */
import * as path from 'path';
import { promisify } from 'util';
import * as fs from 'fs';
import * as zlib from 'zlib';
import * as https from 'https';
import * as http from 'http';

const stat = promisify(fs.stat);

const DOWNLOAD_TIMEOUT = 43200000; // 12 hours in milliseconds

export default async function download(
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

      [filename] = filename.split('?');

      console.log(`Extracted filename: "${filename}" from URL: ${url}`);

      const fileExtension = path.extname(filename);
      const baseName = path.basename(filename, fileExtension);
      const timestamp = Date.now();
      const uniqueFilename = `${baseName}_${timestamp}${fileExtension}`;

      const filePath = path.join(downloadsPath, uniqueFilename);

      const result = await performDownload(url, filePath, (progress) => {
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
      }
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

async function performDownload(
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
          return performDownload(
            redirectUrl,
            filePath,
            onProgress,
            maxRedirects - 1,
          )
            .then(resolve)
            .catch((error) =>
              resolve({ success: false, error: error.message }),
            );
        }
        resolve({
          success: false,
          error:
            maxRedirects <= 0
              ? 'Too many redirects'
              : 'Redirect without location header',
        });
      }

      if (response.statusCode !== 200) {
        resolve({
          success: false,
          error: `HTTP ${response.statusCode}: ${response.statusMessage}`,
        });
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
      console.error(`Download timeout for ${url} after ${DOWNLOAD_TIMEOUT}ms`);
      request.destroy();
      resolve({
        success: false,
        error: 'Download timeout',
      });
    });
  });
}
