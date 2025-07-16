import setupSubjectHandlers from './subject';
import setupQuestionHandlers from './question';

export default function setupDatabaseIPCHandlers() {
  setupSubjectHandlers();
  setupQuestionHandlers();
}
