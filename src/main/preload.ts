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
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
