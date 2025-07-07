import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn, ChildProcess } from 'child_process';
import { Ollama, type GenerateRequest } from 'ollama';
import FileManager from '../files/file-manager';
import { copyDirectory, ensureDirectory } from '../util';
import {
  ARCHS,
  OLLAMA_DOWNLOAD_URLS,
  PLATFORMS,
  MODELS,
} from '../../constants/misc';
import { stat } from 'fs/promises';

export interface LLMServiceProgress {
  error?: Error;
  filename?: string;
  downloaded?: number;
  total?: number;
  percentage?: number;
  status?: string;
  completed?: boolean;
}

export default class LLMServices {
  private static ollamaPath: string;
  private static ollamaProcess: ChildProcess | null = null;
  private static host: string = 'http://127.0.0.1:11434';
  private static ollamaClient: Ollama = new Ollama({ host: this.host });

  static async init(
    onProgress?: (progress: LLMServiceProgress) => void,
  ): Promise<void> {
    try {
      console.log('=== LLM Service Initialization Starting ===');

      const userDataPath = app.getPath('userData');
      this.ollamaPath = path.join(userDataPath, 'files', 'ollama');
      ensureDirectory(this.ollamaPath);

      if (!(await this.maybeDownloadOllama(onProgress))) return;

      onProgress?.({ status: 'installing ollama' });
      if (!(await this.maybeInstallOllama())) return;

      onProgress?.({ status: 'starting ollama' });
      if (!(await this.maybeStartOllama())) return;
      onProgress?.({ status: 'Ollama started successfully' });

      onProgress?.({ status: 'Try to download models' });
      await this.downloadModels(
        [MODELS.GEMMA_3N_E4B_IT, MODELS.NOMIC_EMBED_TEXT_V1_5],
        onProgress,
      );

      onProgress?.({
        status: 'LLM Service Initialization Complete',
        completed: true,
      });

      console.log('=== LLM Service Initialization Complete ===');
    } catch (error) {
      onProgress?.({
        status: `initialization failed due to ${error}`,
        error: new Error(String(error)),
        completed: true,
      });
      console.error('=== LLM Service Initialization Failed ===', error);
    }
  }

  private static getOllamaDownloadUrl(): string {
    const platform = os.platform();
    const arch = os.arch();

    switch (platform) {
      case PLATFORMS.MAC:
        return OLLAMA_DOWNLOAD_URLS.MAC;
      case PLATFORMS.WINDOWS:
        return OLLAMA_DOWNLOAD_URLS.WINDOWS;
      case PLATFORMS.LINUX:
        if (arch === ARCHS.ARM64) {
          return OLLAMA_DOWNLOAD_URLS.LINUX.ARM64;
        } else {
          return OLLAMA_DOWNLOAD_URLS.LINUX.AMD64;
        }
      default:
        throw new Error(`Unsupported platform: ${platform} ${arch}`);
    }
  }

  static async isOllamaDownloaded(): Promise<boolean> {
    try {
      const files = await fs.promises.readdir(this.ollamaPath);
      return files.length > 0;
    } catch {
      return false;
    }
  }

  private static async maybeDownloadOllama(
    onProgress?: (progress: LLMServiceProgress) => void,
  ): Promise<boolean> {
    if (await this.isOllamaDownloaded()) {
      console.info('Ollama already downloaded');
      return true;
    }

    const url = this.getOllamaDownloadUrl();
    const filename = path.basename(url);

    onProgress?.({
      filename,
      downloaded: 0,
      total: 0,
      percentage: 0,
      status: 'starting ollama download',
    });

    const result = await FileManager.downloadFiles(
      [url],
      (progress) => {
        onProgress?.({
          filename: progress.filename || filename,
          downloaded: progress.downloaded,
          total: progress.total,
          percentage: progress.percentage,
          status: 'downloading ollama',
        });
      },
      this.ollamaPath,
    );

    if (result[0]?.success) {
      const platform = os.platform();
      const downloadedFilePath = result[0].filePath;

      if (platform === PLATFORMS.LINUX) {
        // For Linux, the downloaded file is the binary - just rename it to 'ollama'
        const executablePath = path.join(this.ollamaPath, 'ollama');
        await fs.promises.rename(downloadedFilePath, executablePath);
        await fs.promises.chmod(executablePath, '755');
      }

      onProgress?.({
        filename,
        downloaded: result[0].size,
        total: result[0].size,
        percentage: 100,
        status: 'ollama downloaded successfully',
      });

      console.info('Ollama downloaded successfully');
      return true;
    }

    onProgress?.({
      status: 'ollama download failed',
      error: new Error('Ollama download failed'),
    });

    console.error('Ollama download failed');
    return false;
  }

  private static async maybeInstallOllama(): Promise<boolean> {
    const platform = os.platform();
    switch (platform) {
      case PLATFORMS.MAC:
        return await this.installOllamaOnMac();
      case PLATFORMS.WINDOWS:
        return await this.installOllamaOnWindows();
      case PLATFORMS.LINUX:
        return await this.installOllamaOnLinux();
      default:
        console.error(`Unsupported platform: ${platform}`);
        return false;
    }
  }

  private static async installOllamaOnMac(): Promise<boolean> {
    const executablePath = await this.getOllamaExecutablePath();

    if (executablePath != null) {
      console.info('Ollama already installed');
      return true;
    }

    console.info('installing ollama on mac...');

    const files = await fs.promises.readdir(this.ollamaPath);
    const dmgFile = files.find((file) => file.toLowerCase().endsWith('.dmg'));

    if (!dmgFile) {
      throw new Error('No DMG file found for extraction');
    }

    console.info('Found DMG file, extracting Ollama.app...');
    const success = await this.extractOllamaAppFromDMG(dmgFile);

    if (success) {
      console.info('Ollama.app extracted successfully');
      return true;
    } else {
      throw new Error('Failed to extract Ollama.app from DMG');
    }
  }

  private static async extractOllamaAppFromDMG(
    dmgFileName: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const dmgPath = path.join(this.ollamaPath, dmgFileName);
      console.log(`Mounting DMG: ${dmgPath}`);

      const mountProcess = spawn('hdiutil', ['attach', dmgPath, '-nobrowse'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let mountOutput = '';
      mountProcess.stdout.on('data', (data) => {
        mountOutput += data.toString();
      });

      mountProcess.on('close', async (code) => {
        if (code !== 0) {
          console.error('Failed to mount DMG file');
          resolve(false);
          return;
        }

        try {
          const lines = mountOutput.split('\n');
          const mountLine = lines.find((line) => line.includes('/Volumes/'));
          if (!mountLine) {
            console.error('Could not find mount point');
            resolve(false);
            return;
          }

          const mountPoint = mountLine.split('\t').pop()?.trim();
          if (!mountPoint) {
            console.error('Could not parse mount point');
            resolve(false);
            return;
          }

          console.log(`DMG mounted at: ${mountPoint}`);

          const sourceOllamaAppPath = path.join(mountPoint, 'Ollama.app');
          const targetOllamaAppPath = path.join(this.ollamaPath, 'Ollama.app');

          try {
            await fs.promises.access(sourceOllamaAppPath);

            await copyDirectory(sourceOllamaAppPath, targetOllamaAppPath);
            console.log(`Copied Ollama.app to: ${targetOllamaAppPath}`);

            spawn('hdiutil', ['detach', mountPoint], { stdio: 'ignore' });

            await fs.promises.chmod(targetOllamaAppPath, '755');

            try {
              await fs.promises.unlink(dmgPath);
              console.log(`Cleaned up DMG file: ${dmgPath}`);
            } catch (error) {
              console.warn('Failed to clean up DMG file:', error);
            }

            resolve(true);
          } catch (error) {
            console.error('Ollama.app not found in mounted DMG:', error);
            spawn('hdiutil', ['detach', mountPoint], { stdio: 'ignore' });
            resolve(false);
          }
        } catch (error) {
          console.error('Error processing mounted DMG:', error);
          resolve(false);
        }
      });

      mountProcess.on('error', (error) => {
        console.error('Error mounting DMG:', error);
        resolve(false);
      });
    });
  }

  private static async installOllamaOnWindows(): Promise<boolean> {
    return false;
  }

  private static async installOllamaOnLinux(): Promise<boolean> {
    return false;
  }

  private static async maybeStartOllama(): Promise<boolean> {
    if (await this.isOllamaRunning()) {
      return true;
    }
    const platform = os.platform();
    switch (platform) {
      case PLATFORMS.WINDOWS:
        return await this.startOllamaOnWindows();
      case PLATFORMS.MAC:
        return await this.startOllamaOnMac();
      case PLATFORMS.LINUX:
        return await this.startOllamaOnLinux();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private static async getOllamaExecutablePath(): Promise<string | null> {
    const files = await fs.promises.readdir(this.ollamaPath);

    switch (process.platform) {
      case PLATFORMS.WINDOWS:
        const exeFile = files.find((file) =>
          file.toLowerCase().endsWith('.exe'),
        );
        if (!exeFile) {
          throw new Error('No executable file found');
        }
        return path.join(this.ollamaPath, exeFile);
      case PLATFORMS.MAC:
        return await this.getMacOllamaExecutablePath();
      case PLATFORMS.LINUX:
        const linuxFile = files.find((file) =>
          file.toLowerCase().endsWith('.tar.gz'),
        );
        if (!linuxFile) {
          throw new Error('No Linux file found');
        }
        return path.join(this.ollamaPath, linuxFile);
      default:
        throw new Error(`Unsupported platform: ${process.platform}`);
    }
  }

  private static async startOllamaOnMac(): Promise<boolean> {
    if (await this.isOllamaRunning()) {
      console.info('Ollama is already running');
      return true;
    }

    const ollamaExecutable = await this.getOllamaExecutablePath();

    if (!ollamaExecutable) {
      console.error('No Ollama executable found');
      return false;
    }

    return new Promise((resolve, reject) => {
      this.ollamaProcess = spawn(ollamaExecutable, ['serve'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          OLLAMA_HOST: this.host,
          OLLAMA_MODELS: this.ollamaPath,
        },
        detached: false,
      });

      // Handle process events
      this.ollamaProcess.on('error', (error) => {
        console.error('Ollama process error:', error);
      });

      this.ollamaProcess.on('exit', (code, signal) => {
        console.log(
          `Ollama process exited with code ${code} and signal ${signal}`,
        );
        this.ollamaProcess = null;
      });

      // Wait for Ollama to start
      this.waitForPing()
        .then(() => {
          resolve(true);
        })
        .catch((pingError) => {
          if (this.ollamaProcess && !this.ollamaProcess.killed) {
            this.ollamaProcess.kill();
          }
          reject(pingError);
        });
    });
  }

  private static async getMacOllamaExecutablePath(): Promise<string | null> {
    const possibleExecutables = [
      'ollama',
      path.join('Ollama.app', 'Contents', 'Resources', 'ollama'),
      path.join('bin', 'ollama'),
    ];

    for (const execName of possibleExecutables) {
      const execPath = path.join(this.ollamaPath, execName);
      try {
        const stats = await stat(execPath);
        if (stats.isFile()) {
          console.log('Found Ollama executable at:', execPath);

          try {
            await fs.promises.access(
              execPath,
              fs.constants.F_OK | fs.constants.X_OK,
            );
            console.log('Executable is accessible and executable');
            return execPath;
          } catch (accessError) {
            console.warn(
              `Executable found but not accessible: ${execPath}`,
              accessError,
            );
            // Try to make it executable
            try {
              await fs.promises.chmod(execPath, '755');
              console.log('Fixed executable permissions');
              return execPath;
            } catch (chmodError) {
              console.warn('Could not fix executable permissions:', chmodError);
            }
          }
        }
      } catch {}
    }

    return null;
  }

  private static async startOllamaOnWindows(): Promise<boolean> {
    return false;
  }

  private static async startOllamaOnLinux(): Promise<boolean> {
    return false;
  }

  private static async waitForPing(delay = 1000, retries = 5): Promise<void> {
    for (let i = 0; i < retries; i++) {
      if (await this.isOllamaRunning()) {
        return;
      }
      console.info('waiting for ollama server...');
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    console.error("max retries reached. Ollama server didn't respond.");
    throw new Error("Max retries reached. Ollama server didn't respond.");
  }

  private static async isOllamaRunning(): Promise<boolean> {
    try {
      const response = await fetch(this.host, {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.status !== 200) {
        console.info('ollama server is not running', response.status);
        return false;
      }

      return true;
    } catch {
      console.info('ollama server is not running');
      return false;
    }
  }

  static async downloadModels(
    modelNames: (typeof MODELS)[keyof typeof MODELS][],
    onProgress?: (progress: LLMServiceProgress) => void,
  ): Promise<void> {
    if (await this.isOllamaRunning()) {
      const response = await this.ollamaClient.list();
      for (const modelName of modelNames) {
        if (response.models?.some((model) => model.name.includes(modelName))) {
          onProgress?.({
            status: `model ${modelName} is already installed`,
          });
        } else {
          await this.downloadModel(modelName, onProgress);
        }
      }
    }
  }

  static async downloadModel(
    modelName: string,
    onProgress?: (progress: LLMServiceProgress) => void,
  ): Promise<void> {
    onProgress?.({
      filename: modelName,
      downloaded: 0,
      total: 0,
      percentage: 0,
      status: `starting model download ${modelName}`,
    });

    console.info(`downloading model ${modelName}...`);

    let stream = null;

    try {
      stream = await this.ollamaClient.pull({
        model: modelName,
        stream: true,
      });
    } catch (error) {
      console.warn(`failed to download model ${modelName}: ${error}`);
      onProgress?.({
        filename: modelName,
        downloaded: 0,
        total: 0,
        percentage: 0,
        status: `model ${modelName} download failed`,
        error: new Error(String(error)),
      });
    }

    if (stream == null) {
      onProgress?.({
        filename: modelName,
        downloaded: 0,
        total: 0,
        percentage: 0,
        status: `model ${modelName} download failed`,
        error: new Error('Failed to download model'),
      });
      return;
    }

    let totalSize = 0;
    let downloadedSize = 0;

    for await (const part of stream) {
      if (part.total && part.completed) {
        totalSize = part.total;
        downloadedSize = part.completed;

        onProgress?.({
          filename: modelName,
          downloaded: downloadedSize,
          total: totalSize,
          percentage: Math.round((downloadedSize / totalSize) * 100),
          status: `downloading model ${modelName}`,
        });
      }

      if (part.status === 'success') {
        onProgress?.({
          filename: modelName,
          downloaded: totalSize || downloadedSize,
          total: totalSize || downloadedSize,
          percentage: 100,
          status: `model ${modelName} downloaded successfully`,
        });
        break;
      }
    }
  }

  static async stopOllama(): Promise<void> {
    if (this.ollamaProcess) {
      this.ollamaProcess.kill();
      this.ollamaProcess = null;
    }
  }

  /**
   * Create embeddings using Ollama's embed method
   */
  static async createEmbedding(input: string | string[]): Promise<{
    success: boolean;
    embedding?: number[];
    embeddings?: number[][];
    error?: string;
  }> {
    try {
      if (!(await this.isOllamaRunning())) {
        return {
          success: false,
          error: 'Ollama is not running. Please start Ollama first.',
        };
      }

      const list = await this.ollamaClient.list();
      if (
        !list.models?.some((model) =>
          model.name.includes(MODELS.NOMIC_EMBED_TEXT_V1_5),
        )
      ) {
        return {
          success: false,
          error: `Embedding model ${MODELS.NOMIC_EMBED_TEXT_V1_5} is not installed. Please download it first.`,
        };
      }

      const response = await this.ollamaClient.embed({
        model: MODELS.NOMIC_EMBED_TEXT_V1_5,
        input: input,
      });

      if (Array.isArray(input)) {
        return { success: true, embeddings: response.embeddings };
      } else {
        return { success: true, embedding: response.embeddings[0] };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  static async generate(
    request: GenerateRequest,
  ): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      if (!(await this.isOllamaRunning())) {
        return {
          success: false,
          error: 'Ollama is not running. Please start Ollama first.',
        };
      }

      const list = await this.ollamaClient.list();
      if (!list.models?.some((model) => model.name.includes(request.model))) {
        return {
          success: false,
          error: `Model ${request.model} is not installed. Please download it first.`,
        };
      }

      const response = await this.ollamaClient.generate({
        ...request,
        stream: false,
      });

      return {
        success: true,
        response: response.response || 'No response from model',
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
