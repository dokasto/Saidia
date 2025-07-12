import setupSubjectHandlers from './subject';
import setupFileHandlers from './file';
import setupQuestionHandlers from './question';

import setupEmbeddingHandlers from './embedding';

export default function setupDatabaseIPCHandlers() {
  setupSubjectHandlers();
  setupFileHandlers();
  setupQuestionHandlers();
  setupEmbeddingHandlers();
}
