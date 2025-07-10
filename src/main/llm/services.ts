import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn, ChildProcess } from 'child_process';
import { Ollama } from 'ollama';
import FileManager from '../files/file-manager';
import { copyDirectory, ensureDirectory } from '../util';
import {
  ARCHS,
  OLLAMA_DOWNLOAD_URLS,
  PLATFORMS,
  MODELS,
  CONFIG_MODELS,
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
        Array.from(new Set(Object.values(CONFIG_MODELS))),
        onProgress,
      );

      // TODO: Download larger models in the background

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
      this.ollamaPath,
      (progress) => {
        onProgress?.({
          filename: progress.filename || filename,
          downloaded: progress.downloaded,
          total: progress.total,
          percentage: progress.percentage,
          status: 'downloading ollama',
        });
      },
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
    // Check if we have a local installation
    const localExecutablePath = await this.getOllamaExecutablePath();
    if (localExecutablePath != null) {
      console.info('Ollama already installed locally');
      return true;
    }

    console.info('Installing Ollama on Windows...');

    const files = await fs.promises.readdir(this.ollamaPath);
    const ollamaFile = files.find(
      (file) =>
        file.toLowerCase().endsWith('.exe') ||
        file.toLowerCase().endsWith('.zip'),
    );

    if (!ollamaFile) {
      throw new Error(
        'No Ollama executable or archive (.exe or .zip) found in ollamaPath',
      );
    }

    const ollamaFilePath = path.join(this.ollamaPath, ollamaFile);
    console.log(`Found Ollama file: ${ollamaFilePath}`);

    // If it's already an .exe file, just make sure it's executable
    if (ollamaFile.toLowerCase().endsWith('.exe')) {
      try {
        // Ensure the file is executable
        await fs.promises.chmod(ollamaFilePath, '755');
        console.info('Ollama executable ready');
        return true;
      } catch (error) {
        console.error('Failed to set executable permissions:', error);
        return false;
      }
    }

    // If it's a .zip file, extract it
    if (ollamaFile.toLowerCase().endsWith('.zip')) {
      return new Promise((resolve) => {
        const extractProcess = spawn(
          'powershell',
          [
            '-Command',
            `Expand-Archive -Path "${ollamaFilePath}" -DestinationPath "${this.ollamaPath}" -Force`,
          ],
          {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
            windowsHide: true,
          },
        );

        let stdout = '';
        let stderr = '';

        extractProcess.stdout?.on('data', (data) => {
          stdout += data.toString();
          console.log('Extraction output:', data.toString().trim());
        });

        extractProcess.stderr?.on('data', (data) => {
          stderr += data.toString();
          console.warn('Extraction stderr:', data.toString().trim());
        });

        extractProcess.on('close', async (code) => {
          if (code !== 0) {
            console.error('Extraction failed with exit code:', code);
            console.error('Extraction stderr:', stderr);
            resolve(false);
            return;
          }

          console.info('Extraction completed. Verifying...');

          // Check if we now have an executable
          const localInstalled = await this.getOllamaExecutablePath();

          if (localInstalled) {
            console.info('Ollama extracted successfully!');

            // Clean up archive file
            try {
              await fs.promises.unlink(ollamaFilePath);
              console.log(`Cleaned up archive: ${ollamaFilePath}`);
            } catch (error) {
              console.warn('Failed to clean up archive:', error);
            }

            resolve(true);
          } else {
            console.error('Ollama extraction verification failed.');
            console.error('Local installation check:', localInstalled);
            resolve(false);
          }
        });

        extractProcess.on('error', (error) => {
          console.error('Failed to extract Ollama:', error);
          resolve(false);
        });
      });
    }

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
        // Check for local executable
        const exeFile = files.find((file) =>
          file.toLowerCase().endsWith('.exe'),
        );
        if (!exeFile) {
          return null; // Don't throw error, just return null
        }
        return path.join(this.ollamaPath, exeFile);
      case PLATFORMS.MAC:
        return await this.getMacOllamaExecutablePath();
      case PLATFORMS.LINUX:
        const linuxFile = files.find((file) =>
          file.toLowerCase().endsWith('.tar.gz'),
        );
        if (!linuxFile) {
          return null; // Don't throw error, just return null
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
    if (await this.isOllamaRunning()) {
      console.info('Ollama is already running');
      return true;
    }

    const ollamaExecutable = await this.getOllamaExecutablePath();

    if (!ollamaExecutable) {
      console.error('No Ollama executable found');
      return false;
    }

    console.info(`Starting Ollama on Windows from: ${ollamaExecutable}`);

    return new Promise((resolve, reject) => {
      // Set up startup timeout
      const startupTimeout = setTimeout(() => {
        console.error('Ollama startup timed out after 30 seconds');
        if (this.ollamaProcess && !this.ollamaProcess.killed) {
          this.ollamaProcess.kill('SIGTERM');
        }
        reject(new Error('Ollama startup timed out'));
      }, 30000); // 30 seconds timeout

      // Windows-specific environment setup
      const env = {
        ...process.env,
        OLLAMA_HOST: this.host,
        OLLAMA_MODELS: this.ollamaPath,
        // Ensure proper PATH for Windows
        PATH: `${path.dirname(ollamaExecutable)};${process.env.PATH || ''}`,
      };

      this.ollamaProcess = spawn(ollamaExecutable, ['serve'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
        detached: false,
        windowsHide: true,
        cwd: path.dirname(ollamaExecutable), // Set working directory to executable location
      });

      let stdout = '';
      let stderr = '';

      // Capture stdout for debugging
      this.ollamaProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log('Ollama stdout:', output.trim());
      });

      // Capture stderr for error diagnosis
      this.ollamaProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.warn('Ollama stderr:', output.trim());
      });

      // Handle process events
      this.ollamaProcess.on('error', (error) => {
        clearTimeout(startupTimeout);
        console.error('Ollama process spawn error:', error);
        reject(error);
      });

      this.ollamaProcess.on('exit', (code, signal) => {
        clearTimeout(startupTimeout);
        console.log(
          `Ollama process exited with code ${code} and signal ${signal}`,
        );

        if (code !== 0 && code !== null) {
          console.error('Ollama process failed to start properly');
          console.error('Process stdout:', stdout);
          console.error('Process stderr:', stderr);
        }

        this.ollamaProcess = null;
      });

      // Wait for Ollama to start and be ready
      this.waitForPing(2000, 15) // Increased retries and delay for Windows
        .then(() => {
          clearTimeout(startupTimeout);
          console.info('Ollama started successfully on Windows');
          resolve(true);
        })
        .catch((pingError) => {
          clearTimeout(startupTimeout);
          console.error('Ollama ping failed:', pingError);
          console.error('Process stdout:', stdout);
          console.error('Process stderr:', stderr);

          if (this.ollamaProcess && !this.ollamaProcess.killed) {
            console.info('Terminating Ollama process due to ping failure');
            this.ollamaProcess.kill('SIGTERM');
          }
          reject(pingError);
        });
    });
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

  static async createEmbedding(input: string): Promise<{
    success: boolean;
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
        !list.models?.some((model: any) =>
          model.name.includes(CONFIG_MODELS.EMBEDDING_MODEL),
        )
      ) {
        return {
          success: false,
          error: `Embedding model ${CONFIG_MODELS.EMBEDDING_MODEL} is not installed. Please download it first.`,
        };
      }

      const response = await this.ollamaClient.embed({
        model: CONFIG_MODELS.EMBEDDING_MODEL,
        input: input,
      });

      return { success: true, embeddings: response.embeddings };
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
      if (
        !list.models?.some((model: any) => model.name.includes(request.model))
      ) {
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
      console.error(`failed to generate: ${error}`);
      return { success: false, error: String(error) };
    }
  }
}
