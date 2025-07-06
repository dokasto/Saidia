// IPC Event Constants
// This file contains all the IPC event names used for communication between main and renderer processes

// Subject Events
export const SUBJECT_EVENTS = {
  CREATE: 'db:createSubject',
  GET_ALL: 'db:getSubjects',
  GET_ONE: 'db:getSubject',
  UPDATE: 'db:updateSubject',
  DELETE: 'db:deleteSubject',
} as const;

// File Events
export const FILE_EVENTS = {
  CREATE: 'db:createFile',
  GET_ALL: 'db:getFiles',
  GET_ONE: 'db:getFile',
  UPDATE: 'db:updateFile',
  DELETE: 'db:deleteFile',
} as const;

// Question Events
export const QUESTION_EVENTS = {
  CREATE: 'db:createQuestion',
  GET_ALL: 'db:getQuestions',
  GET_ONE: 'db:getQuestion',
  UPDATE: 'db:updateQuestion',
  DELETE: 'db:deleteQuestion',
} as const;

// Tag Events
export const TAG_EVENTS = {
  CREATE: 'db:createTag',
  GET_ALL: 'db:getTags',
  ADD_TO_QUESTION: 'db:addTagsToQuestion',
  REMOVE_FROM_QUESTION: 'db:removeTagFromQuestion',
} as const;

// Embedding Events
export const EMBEDDING_EVENTS = {
  ADD: 'db:addEmbedding',
  SEARCH_SIMILAR: 'db:searchSimilar',
  GET_BY_FILE: 'db:getEmbeddingsByFile',
  GET_BY_SUBJECT: 'db:getEmbeddingsBySubject',
} as const;

// File System Events
export const FILE_SYSTEM_EVENTS = {
  UPLOAD_AND_PROCESS: 'file:uploadAndProcess',
  GET_STORAGE_PATH: 'file:getStoragePath',
  GET_ABSOLUTE_PATH: 'file:getAbsolutePath',
  EXISTS: 'file:exists',
  GET_INFO: 'file:getInfo',
  CHECK_INITIALIZATION: 'file:checkInitialization',
} as const;

// Download Events
export const DOWNLOAD_EVENTS = {
  DOWNLOAD_FILES: 'download:files',
  GET_DOWNLOADED_FILES: 'download:getFiles',
  DELETE_DOWNLOADED_FILE: 'download:deleteFile',
  GET_DOWNLOADS_PATH: 'download:getPath',
  PROGRESS: 'download:progress',
} as const;

// Dialog Events
export const DIALOG_EVENTS = {
  SHOW_OPEN_DIALOG: 'dialog:showOpenDialog',
} as const;

// LLM Events
export const LLM_EVENTS = {
  DOWNLOAD_OLLAMA: 'llm:downloadOllama',
  CHECK_OLLAMA_INSTALLED: 'llm:checkOllamaInstalled',
  START_OLLAMA: 'llm:startOllama',
  DOWNLOAD_MODEL: 'llm:downloadModel',
  CHECK_MODEL_INSTALLED: 'llm:checkModelInstalled',
  GET_AVAILABLE_MODELS: 'llm:getAvailableModels',
  GET_MODEL_NAME: 'llm:getModelName',
  GET_EMBEDDING_MODEL_NAME: 'llm:getEmbeddingModelName',
  START_CHAT: 'llm:startChat',
  SEND_MESSAGE: 'llm:sendMessage',
  STOP_CHAT: 'llm:stopChat',
  GET_CHAT_HISTORY: 'llm:getChatHistory',
  CLEAR_CHAT_HISTORY: 'llm:clearChatHistory',
  PROGRESS: 'llm:progress',
  STREAM_RESPONSE: 'llm:streamResponse',
  DOWNLOAD_EMBEDDING_MODEL: 'llm:downloadEmbeddingModel',
  CHECK_EMBEDDING_MODEL_INSTALLED: 'llm:checkEmbeddingModelInstalled',
  CREATE_EMBEDDING: 'llm:createEmbedding',
  GENERATE: 'llm:generate',
} as const;

// All Events (for easy access)
export const IPC_EVENTS = {
  ...SUBJECT_EVENTS,
  ...FILE_EVENTS,
  ...QUESTION_EVENTS,
  ...TAG_EVENTS,
  ...EMBEDDING_EVENTS,
  ...FILE_SYSTEM_EVENTS,
  ...DOWNLOAD_EVENTS,
  ...DIALOG_EVENTS,
  ...LLM_EVENTS,
} as const;
