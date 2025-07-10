import setupDatabaseIPCHandlers from './database/ipc-handlers/index';
import setupFilesIPCHandlers from './files/ipc-handlers';
import setupDownloadIPCHandlers from './files/download-ipc-handlers';
import setupLLMIPCHandlers from './llm/ipc-handlers';

export type IPCResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

export default function setupIPCHandlers() {
  setupDatabaseIPCHandlers();
  setupFilesIPCHandlers();
  setupDownloadIPCHandlers();
  setupLLMIPCHandlers();
}
