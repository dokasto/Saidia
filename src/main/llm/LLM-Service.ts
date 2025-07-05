import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { Ollama } from 'ollama';
import { FileManager } from '../files/file-manager';

const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DownloadProgress {
  type: 'ollama' | 'model';
  filename: string;
  downloaded: number;
  total: number;
  percentage: number;
  status: 'starting' | 'downloading' | 'completed' | 'error';
}

export class LLMService {
  private static ollamaPath: string;
  private static modelsPath: string;
  private static ollamaProcess: ChildProcess | null = null;
  private static chatSessions: Map<string, ChatSession> = new Map();
  private static currentSessionId: string | null = null;
  private static ollamaClient: Ollama = new Ollama({
    host: 'http://127.0.0.1:11434',
  });

  /**
   * Initialize the LLM service
   */
  static async initialize(): Promise<void> {
    try {
      console.log('=== LLM Service Initialization Starting ===');

      const userDataPath = app.getPath('userData');
      // Use the same path structure as FileManager downloads
      this.ollamaPath = path.join(
        userDataPath,
        'files',
        'appDownloads',
        'ollama',
      );
      this.modelsPath = path.join(userDataPath, 'models');

      // Create directories
      await mkdir(this.ollamaPath, { recursive: true });
      await mkdir(this.modelsPath, { recursive: true });

      console.log('Ollama path:', this.ollamaPath);
      console.log('Models path:', this.modelsPath);

      // Clean up old DMG files if an executable already exists
      await this.cleanupOldDMGFiles();

      console.log('=== LLM Service Initialization Complete ===');
    } catch (error) {
      console.error('=== LLM Service Initialization Failed ===');
      console.error('Error details:', error);
      throw error;
    }
  }

  /**
   * Get the appropriate Ollama download URL for the current platform
   */
  private static getOllamaDownloadUrl(): string {
    const platform = os.platform();
    const arch = os.arch();

    if (platform === 'darwin') {
      return 'https://github.com/ollama/ollama/releases/download/v0.9.5/Ollama.dmg';
    } else if (platform === 'win32') {
      return 'https://github.com/ollama/ollama/releases/download/v0.9.5/ollama-windows-amd64.zip';
    } else if (platform === 'linux') {
      if (arch === 'arm64') {
        return 'https://github.com/ollama/ollama/releases/download/v0.9.5/ollama-linux-arm64';
      } else {
        return 'https://github.com/ollama/ollama/releases/download/v0.9.5/ollama-linux-amd64';
      }
    }

    throw new Error(`Unsupported platform: ${platform} ${arch}`);
  }

  /**
   * Check if Ollama is installed
   */
  static async isOllamaInstalled(): Promise<boolean> {
    try {
      // Try to find the Ollama executable in the downloaded location
      await this.getOllamaExecutablePath();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Download Ollama using existing FileManager
   */
  static async downloadOllama(
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const url = this.getOllamaDownloadUrl();
      const filename = path.basename(url);

      onProgress?.({
        type: 'ollama',
        filename,
        downloaded: 0,
        total: 0,
        percentage: 0,
        status: 'starting',
      });

      const result = await FileManager.downloadFiles(
        [url],
        (progress) => {
          onProgress?.({
            type: 'ollama',
            filename: progress.filename || filename,
            downloaded: progress.downloaded,
            total: progress.total,
            percentage: progress.percentage,
            status: progress.status,
          });
        },
        'ollama',
      );

      if (result[0]?.success) {
        // Handle post-download processing based on platform
        const platform = os.platform();
        const downloadedFilePath = result[0].filePath;

        try {
          if (platform === 'linux') {
            // For Linux, the downloaded file is the binary - just rename it to 'ollama'
            const executablePath = path.join(this.ollamaPath, 'ollama');
            await fs.promises.rename(downloadedFilePath, executablePath);
            // Make it executable
            await fs.promises.chmod(executablePath, '755');
          } else if (platform === 'win32') {
            // For Windows, we need to extract the ZIP file
            // For now, we'll just note that the ZIP file is downloaded
            // The user will need to extract it manually or we'd need to add ZIP extraction
            console.log(
              'Windows ZIP file downloaded. Manual extraction may be required.',
            );
          } else if (platform === 'darwin') {
            // For macOS, we need to handle the DMG file
            // For now, we'll just note that the DMG file is downloaded
            // The user will need to mount and extract it manually
            console.log(
              'macOS DMG file downloaded. Manual mounting and extraction may be required.',
            );
          }
        } catch (error) {
          console.error('Error processing downloaded file:', error);
          // Don't fail the download if post-processing fails
        }

        onProgress?.({
          type: 'ollama',
          filename,
          downloaded: result[0].size,
          total: result[0].size,
          percentage: 100,
          status: 'completed',
        });
        return { success: true };
      } else {
        return { success: false, error: result[0]?.error || 'Download failed' };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Check if a model is installed
   */
  static async isModelInstalled(modelName: string): Promise<boolean> {
    try {
      // If Ollama is running, use the ollama-js library to check for models
      if (this.isOllamaRunning()) {
        const response = await this.ollamaClient.list();
        return (
          response.models?.some((model) => model.name.includes(modelName)) ||
          false
        );
      }

      // Fallback to file system check
      const files = await readdir(this.modelsPath);
      return files.some((file) => file.includes(modelName));
    } catch {
      return false;
    }
  }

  /**
   * Download a model using Ollama's pull command
   */
  static async downloadModel(
    modelName: string,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      onProgress?.({
        type: 'model',
        filename: modelName,
        downloaded: 0,
        total: 0,
        percentage: 0,
        status: 'starting',
      });

      // Check if Ollama is running
      if (!this.isOllamaRunning()) {
        return {
          success: false,
          error: 'Ollama is not running. Please start Ollama first.',
        };
      }

      // Use ollama-js library to pull the model with streaming
      const stream = await this.ollamaClient.pull({
        model: modelName,
        stream: true,
      });

      let totalSize = 0;
      let downloadedSize = 0;

      for await (const part of stream) {
        if (part.total && part.completed) {
          totalSize = part.total;
          downloadedSize = part.completed;

          onProgress?.({
            type: 'model',
            filename: modelName,
            downloaded: downloadedSize,
            total: totalSize,
            percentage: Math.round((downloadedSize / totalSize) * 100),
            status: 'downloading',
          });
        }

        if (part.status === 'success') {
          onProgress?.({
            type: 'model',
            filename: modelName,
            downloaded: totalSize || downloadedSize,
            total: totalSize || downloadedSize,
            percentage: 100,
            status: 'completed',
          });
          return { success: true };
        }
      }

      return { success: true };
    } catch (error) {
      onProgress?.({
        type: 'model',
        filename: modelName,
        downloaded: 0,
        total: 0,
        percentage: 0,
        status: 'error',
      });
      return { success: false, error: String(error) };
    }
  }

  /**
   * Start Ollama service
   */
  static async startOllama(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if Ollama is already running
      if (this.ollamaProcess && !this.ollamaProcess.killed) {
        return { success: true };
      }

      // Get the Ollama executable path
      let ollamaExecutable: string;
      try {
        ollamaExecutable = await this.getOllamaExecutablePath();
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }

      console.log('Starting Ollama process:', ollamaExecutable);

      // Start Ollama process
      this.ollamaProcess = spawn(ollamaExecutable, ['serve'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          OLLAMA_HOST: '127.0.0.1:11434',
          OLLAMA_MODELS: this.modelsPath,
        },
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

      // Capture stdout and stderr for debugging
      if (this.ollamaProcess?.stdout) {
        this.ollamaProcess.stdout.on('data', (data) => {
          console.log('Ollama stdout:', data.toString());
        });
      }

      if (this.ollamaProcess?.stderr) {
        this.ollamaProcess.stderr.on('data', (data) => {
          console.log('Ollama stderr:', data.toString());
        });
      }

      // Wait a bit for the process to start
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if process is still running
      if (this.ollamaProcess && !this.ollamaProcess.killed) {
        console.log('Ollama started successfully');
        return { success: true };
      } else {
        return { success: false, error: 'Ollama process failed to start' };
      }
    } catch (error) {
      console.error('Error starting Ollama:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get the path to the Ollama executable based on platform
   */
  private static async getOllamaExecutablePath(): Promise<string> {
    const platform = os.platform();

    try {
      // First, scan the ollama directory to find any downloaded files
      const files = await readdir(this.ollamaPath);
      console.log('Files in ollama directory:', files);

      if (platform === 'darwin') {
        // On macOS, look for DMG files or extracted executables
        // First check for extracted executables
        const possibleExecutables = [
          'ollama',
          path.join('Ollama.app', 'Contents', 'Resources', 'ollama'),
          path.join('bin', 'ollama'),
        ];

        for (const execName of possibleExecutables) {
          const execPath = path.join(this.ollamaPath, execName);
          try {
            await stat(execPath);
            console.log('Found Ollama executable at:', execPath);
            return execPath;
          } catch {
            // Continue to next path
          }
        }

        // If no executable found, look for DMG files and try to extract
        const dmgFile = files.find((file) =>
          file.toLowerCase().endsWith('.dmg'),
        );
        if (dmgFile) {
          console.log(`Found DMG file: ${dmgFile}, attempting to extract...`);
          try {
            const extractedPath = await this.extractDMG(dmgFile);
            if (extractedPath) {
              console.log('Successfully extracted Ollama from DMG');
              return extractedPath;
            }
          } catch (error) {
            console.error('Failed to extract DMG:', error);
          }
          throw new Error(
            `Found DMG file (${dmgFile}) but failed to extract executable. Please manually mount the DMG and copy Ollama.app to the downloads directory.`,
          );
        }
      } else if (platform === 'win32') {
        // On Windows, look for ZIP files or extracted executables
        // First check for extracted executables
        const possibleExecutables = [
          'ollama.exe',
          path.join('bin', 'ollama.exe'),
        ];

        for (const execName of possibleExecutables) {
          const execPath = path.join(this.ollamaPath, execName);
          try {
            await stat(execPath);
            console.log('Found Ollama executable at:', execPath);
            return execPath;
          } catch {
            // Continue to next path
          }
        }

        // If no executable found, look for ZIP files
        const zipFile = files.find((file) =>
          file.toLowerCase().endsWith('.zip'),
        );
        if (zipFile) {
          throw new Error(
            `Found ZIP file (${zipFile}) but no extracted executable. Please extract the ZIP file contents to the downloads directory.`,
          );
        }
      } else if (platform === 'linux') {
        // On Linux, look for the binary directly (might have timestamp in name)
        // First check for standard executable names
        const possibleExecutables = ['ollama', path.join('bin', 'ollama')];

        for (const execName of possibleExecutables) {
          const execPath = path.join(this.ollamaPath, execName);
          try {
            await stat(execPath);
            console.log('Found Ollama executable at:', execPath);
            return execPath;
          } catch {
            // Continue to next path
          }
        }

        // Look for files that contain 'ollama' in the name (downloaded binaries)
        const ollamaFile = files.find(
          (file) =>
            file.toLowerCase().includes('ollama') &&
            !file.toLowerCase().endsWith('.dmg') &&
            !file.toLowerCase().endsWith('.zip'),
        );

        if (ollamaFile) {
          const execPath = path.join(this.ollamaPath, ollamaFile);
          try {
            await stat(execPath);
            console.log('Found Ollama binary at:', execPath);
            return execPath;
          } catch {
            // File exists but might not be executable
          }
        }
      }
    } catch (error) {
      console.error('Error scanning ollama directory:', error);
    }

    throw new Error(
      `Ollama executable not found in downloads directory: ${this.ollamaPath}. Please download Ollama first.`,
    );
  }

  /**
   * Extract Ollama executable from DMG file on macOS
   */
  private static async extractDMG(dmgFileName: string): Promise<string | null> {
    return new Promise((resolve) => {
      const dmgPath = path.join(this.ollamaPath, dmgFileName);
      console.log(`Attempting to mount DMG: ${dmgPath}`);

      // Mount the DMG file
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
          resolve(null);
          return;
        }

        try {
          // Parse mount output to find the mount point
          const lines = mountOutput.split('\n');
          const mountLine = lines.find((line) => line.includes('/Volumes/'));
          if (!mountLine) {
            console.error('Could not find mount point');
            resolve(null);
            return;
          }

          const mountPoint = mountLine.split('\t').pop()?.trim();
          if (!mountPoint) {
            console.error('Could not parse mount point');
            resolve(null);
            return;
          }

          console.log(`DMG mounted at: ${mountPoint}`);

          // Look for Ollama.app in the mounted volume
          const ollamaAppPath = path.join(mountPoint, 'Ollama.app');
          const ollamaExecutablePath = path.join(
            ollamaAppPath,
            'Contents',
            'Resources',
            'ollama',
          );

          try {
            await stat(ollamaExecutablePath);

            // Copy the executable to our downloads directory
            const targetExecutablePath = path.join(this.ollamaPath, 'ollama');
            await fs.promises.copyFile(
              ollamaExecutablePath,
              targetExecutablePath,
            );
            await fs.promises.chmod(targetExecutablePath, '755');

            console.log(`Copied Ollama executable to: ${targetExecutablePath}`);

            // Unmount the DMG
            spawn('hdiutil', ['detach', mountPoint], { stdio: 'ignore' });

            // Clean up the DMG file after successful extraction
            try {
              await fs.promises.unlink(dmgPath);
              console.log(`Cleaned up DMG file: ${dmgPath}`);
            } catch (error) {
              console.warn('Failed to clean up DMG file:', error);
            }

            resolve(targetExecutablePath);
          } catch (error) {
            console.error('Ollama executable not found in mounted DMG:', error);
            // Unmount the DMG
            spawn('hdiutil', ['detach', mountPoint], { stdio: 'ignore' });
            resolve(null);
          }
        } catch (error) {
          console.error('Error processing mounted DMG:', error);
          resolve(null);
        }
      });

      mountProcess.on('error', (error) => {
        console.error('Error mounting DMG:', error);
        resolve(null);
      });
    });
  }

  /**
   * Check if Ollama is currently running
   */
  static isOllamaRunning(): boolean {
    return this.ollamaProcess !== null && !this.ollamaProcess.killed;
  }

  /**
   * Get list of available models
   */
  static async getAvailableModels(): Promise<{
    success: boolean;
    models?: any[];
    error?: string;
  }> {
    try {
      if (!this.isOllamaRunning()) {
        return { success: false, error: 'Ollama is not running' };
      }

      const response = await this.ollamaClient.list();
      return { success: true, models: response.models || [] };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Stop Ollama service
   */
  static async stopOllama(): Promise<void> {
    if (this.ollamaProcess) {
      this.ollamaProcess.kill();
      this.ollamaProcess = null;
    }
  }

  /**
   * Create a new chat session
   */
  static createChatSession(model: string): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: ChatSession = {
      id: sessionId,
      messages: [],
      model,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.chatSessions.set(sessionId, session);
    this.currentSessionId = sessionId;

    return sessionId;
  }

  /**
   * Get chat session
   */
  static getChatSession(sessionId: string): ChatSession | undefined {
    return this.chatSessions.get(sessionId);
  }

  /**
   * Get current chat session
   */
  static getCurrentSession(): ChatSession | undefined {
    if (!this.currentSessionId) return undefined;
    return this.chatSessions.get(this.currentSessionId);
  }

  /**
   * Send a message to the LLM
   */
  static async sendMessage(
    message: string,
    sessionId?: string,
    onStream?: (chunk: string) => void,
  ): Promise<{ success: boolean; error?: string; response?: string }> {
    try {
      const targetSessionId = sessionId || this.currentSessionId;
      if (!targetSessionId) {
        return { success: false, error: 'No active chat session' };
      }

      const session = this.chatSessions.get(targetSessionId);
      if (!session) {
        return { success: false, error: 'Chat session not found' };
      }

      // Add user message to session
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      session.messages.push(userMessage);
      session.updatedAt = new Date();

      let response: string;

      // Use ollama-js library if available, otherwise simulate
      if (this.isOllamaRunning()) {
        // Convert session messages to Ollama format
        const messages = session.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        if (onStream) {
          // Handle streaming response using ollama-js
          const stream = await this.ollamaClient.chat({
            model: session.model,
            messages: messages,
            stream: true,
          });

          let fullResponse = '';
          for await (const part of stream) {
            if (part.message?.content) {
              onStream(part.message.content);
              fullResponse += part.message.content;
            }
          }
          response = fullResponse;
        } else {
          // Handle non-streaming response using ollama-js
          const ollamaResponse = await this.ollamaClient.chat({
            model: session.model,
            messages: messages,
            stream: false,
          });
          response =
            ollamaResponse.message?.content || 'No response from model';
        }
      } else {
        // Simulate AI response when Ollama is not running
        response = `This is a simulated response to: "${message}". The actual Ollama integration will be available once the service is running.`;

        // Simulate streaming
        if (onStream) {
          const words = response.split(' ');
          for (const word of words) {
            onStream(word + ' ');
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      }

      // Add assistant message to session
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      session.messages.push(assistantMessage);
      session.updatedAt = new Date();

      return { success: true, response };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get chat history
   */
  static getChatHistory(sessionId?: string): ChatMessage[] {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) return [];

    const session = this.chatSessions.get(targetSessionId);
    return session?.messages || [];
  }

  /**
   * Clear chat history
   */
  static clearChatHistory(sessionId?: string): void {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) return;

    const session = this.chatSessions.get(targetSessionId);
    if (session) {
      session.messages = [];
      session.updatedAt = new Date();
    }
  }

  /**
   * Get all chat sessions
   */
  static getAllSessions(): ChatSession[] {
    return Array.from(this.chatSessions.values());
  }

  /**
   * Delete a chat session
   */
  static deleteSession(sessionId: string): boolean {
    const deleted = this.chatSessions.delete(sessionId);
    if (deleted && this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
    return deleted;
  }

  /**
   * Clean up old DMG files if an executable already exists
   */
  private static async cleanupOldDMGFiles(): Promise<void> {
    try {
      // Check if we already have an executable
      const hasExecutable = await this.isOllamaInstalled();
      if (!hasExecutable) {
        return; // Keep DMG files if no executable exists
      }

      // List files in the ollama directory
      const files = await readdir(this.ollamaPath);
      const dmgFiles = files.filter((file) =>
        file.toLowerCase().endsWith('.dmg'),
      );

      if (dmgFiles.length > 0) {
        console.log(`Cleaning up ${dmgFiles.length} old DMG files...`);

        for (const dmgFile of dmgFiles) {
          try {
            const dmgPath = path.join(this.ollamaPath, dmgFile);
            await fs.promises.unlink(dmgPath);
            console.log(`Removed old DMG file: ${dmgFile}`);
          } catch (error) {
            console.warn(`Failed to remove DMG file ${dmgFile}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('Error during DMG cleanup:', error);
    }
  }
}
