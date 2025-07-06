// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
  DIALOG_EVENTS,
  DOWNLOAD_EVENTS,
  LLM_EVENTS,
} from '../constants/events';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: string, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    invoke(channel: string, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
    removeAllListeners(channel: string) {
      ipcRenderer.removeAllListeners(channel);
    },
  },
  dialog: {
    showOpenDialog: (options: any) => {
      return ipcRenderer.invoke(DIALOG_EVENTS.SHOW_OPEN_DIALOG, options);
    },
  },
  download: {
    downloadFiles: (urls: string[], folderName?: string) => {
      return ipcRenderer.invoke(
        DOWNLOAD_EVENTS.DOWNLOAD_FILES,
        urls,
        folderName,
      );
    },
    getDownloadedFiles: () => {
      return ipcRenderer.invoke(DOWNLOAD_EVENTS.GET_DOWNLOADED_FILES);
    },
    deleteDownloadedFile: (filename: string) => {
      return ipcRenderer.invoke(
        DOWNLOAD_EVENTS.DELETE_DOWNLOADED_FILE,
        filename,
      );
    },
    getDownloadsPath: () => {
      return ipcRenderer.invoke(DOWNLOAD_EVENTS.GET_DOWNLOADS_PATH);
    },
    onProgress: (callback: (progress: any) => void) => {
      const subscription = (_event: IpcRendererEvent, progress: any) =>
        callback(progress);
      ipcRenderer.on(DOWNLOAD_EVENTS.PROGRESS, subscription);

      return () => {
        ipcRenderer.removeListener(DOWNLOAD_EVENTS.PROGRESS, subscription);
      };
    },
  },
  llm: {
    // Ollama management
    checkOllamaInstalled: () => {
      return ipcRenderer.invoke(LLM_EVENTS.CHECK_OLLAMA_INSTALLED);
    },
    startOllama: () => {
      return ipcRenderer.invoke(LLM_EVENTS.START_OLLAMA);
    },
    downloadOllama: () => {
      return ipcRenderer.invoke(LLM_EVENTS.DOWNLOAD_OLLAMA);
    },

    // Model management
    checkModelInstalled: (modelName?: string) => {
      return ipcRenderer.invoke(LLM_EVENTS.CHECK_MODEL_INSTALLED, modelName);
    },
    downloadModel: (modelName?: string) => {
      return ipcRenderer.invoke(LLM_EVENTS.DOWNLOAD_MODEL, modelName);
    },
    getAvailableModels: () => {
      return ipcRenderer.invoke(LLM_EVENTS.GET_AVAILABLE_MODELS);
    },
    getModelName: () => {
      return ipcRenderer.invoke(LLM_EVENTS.GET_MODEL_NAME);
    },

    // Embedding model management
    checkEmbeddingModelInstalled: () => {
      return ipcRenderer.invoke(LLM_EVENTS.CHECK_EMBEDDING_MODEL_INSTALLED);
    },
    downloadEmbeddingModel: () => {
      return ipcRenderer.invoke(LLM_EVENTS.DOWNLOAD_EMBEDDING_MODEL);
    },
    getEmbeddingModelName: () => {
      return ipcRenderer.invoke(LLM_EVENTS.GET_EMBEDDING_MODEL_NAME);
    },

    // Chat functionality
    startChat: (model?: string) => {
      return ipcRenderer.invoke(LLM_EVENTS.START_CHAT, model);
    },
    sendMessage: (message: string, sessionId?: string) => {
      return ipcRenderer.invoke(LLM_EVENTS.SEND_MESSAGE, message, sessionId);
    },
    getChatHistory: (sessionId?: string) => {
      return ipcRenderer.invoke(LLM_EVENTS.GET_CHAT_HISTORY, sessionId);
    },
    clearChatHistory: (sessionId?: string) => {
      return ipcRenderer.invoke(LLM_EVENTS.CLEAR_CHAT_HISTORY, sessionId);
    },
    stopChat: () => {
      return ipcRenderer.invoke(LLM_EVENTS.STOP_CHAT);
    },

    // Embedding functionality
    createEmbedding: (input: string | string[]) => {
      return ipcRenderer.invoke(LLM_EVENTS.CREATE_EMBEDDING, input);
    },

    // Event listeners
    onProgress: (callback: (progress: any) => void) => {
      const subscription = (_event: IpcRendererEvent, progress: any) =>
        callback(progress);
      ipcRenderer.on(LLM_EVENTS.PROGRESS, subscription);

      return () => {
        ipcRenderer.removeListener(LLM_EVENTS.PROGRESS, subscription);
      };
    },
    onStreamResponse: (callback: (data: any) => void) => {
      const subscription = (_event: IpcRendererEvent, data: any) =>
        callback(data);
      ipcRenderer.on(LLM_EVENTS.STREAM_RESPONSE, subscription);

      return () => {
        ipcRenderer.removeListener(LLM_EVENTS.STREAM_RESPONSE, subscription);
      };
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
