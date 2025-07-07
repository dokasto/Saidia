import setupDatabaseIPCHandlers from './database/ipc-handlers';
import setupFilesIPCHandlers from './files/ipc-handlers';
import setupLLMIPCHandlers from './llm/ipc-handlers';

export default function setupIPCHandlers() {
  setupDatabaseIPCHandlers();
  setupFilesIPCHandlers();
  setupLLMIPCHandlers();
}
