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
  GET_SUBJECT_FILE_PATH: 'file:getSubjectFilePath',
  LIST_SUBJECT_FILES: 'file:listSubjectFiles',
  DELETE_SUBJECT_FILE: 'file:deleteSubjectFile',
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

export const LLM_EVENTS = {
  INIT: 'llm:init',
  PROGRESS: 'llm:progress',
  GENERATE_QUESTIONS: 'llm:generateQuestions',
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
