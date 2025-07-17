// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { LLM_EVENTS } from '../constants/events';
import { LLMInitialisationProgress } from './llm/services';

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
  llm: {
    initialise: () => {
      return ipcRenderer.invoke(LLM_EVENTS.INIT);
    },

    onInitialisationProgress: (
      callback: (progress: LLMInitialisationProgress) => void,
    ) => {
      const subscription = (
        _event: IpcRendererEvent,
        progress: LLMInitialisationProgress,
      ) => callback(progress);
      ipcRenderer.on(LLM_EVENTS.INITIALISATION_PROGRESS, subscription);

      return () => {
        ipcRenderer.removeListener(
          LLM_EVENTS.INITIALISATION_PROGRESS,
          subscription,
        );
      };
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
