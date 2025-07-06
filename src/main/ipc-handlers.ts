import { ipcMain, dialog } from 'electron';
import { DatabaseService } from './database/services';
import FileManager from './files/file-manager';
import LLMService from './llm/LLM-Service';
import * as path from 'path';
import {
  SUBJECT_EVENTS,
  FILE_EVENTS,
  QUESTION_EVENTS,
  TAG_EVENTS,
  EMBEDDING_EVENTS,
  FILE_SYSTEM_EVENTS,
  DOWNLOAD_EVENTS,
  DIALOG_EVENTS,
  LLM_EVENTS,
} from '../constants/events';
import { type GenerateRequest } from 'ollama';

const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export function setupIpcHandlers() {
  // Subject handlers
  ipcMain.handle(
    SUBJECT_EVENTS.CREATE,
    async (event, subject_id: string, name: string) => {
      try {
        const subject = await DatabaseService.createSubject(subject_id, name);
        return { success: true, data: subject };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(SUBJECT_EVENTS.GET_ALL, async () => {
    try {
      const subjects = await DatabaseService.getSubjects();
      return { success: true, data: subjects };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(SUBJECT_EVENTS.GET_ONE, async (event, subject_id: string) => {
    try {
      const subject = await DatabaseService.getSubject(subject_id);
      return { success: true, data: subject };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    SUBJECT_EVENTS.UPDATE,
    async (event, subject_id: string, updates: any) => {
      try {
        const result = await DatabaseService.updateSubject(subject_id, updates);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(SUBJECT_EVENTS.DELETE, async (event, subject_id: string) => {
    try {
      const result = await DatabaseService.deleteSubject(subject_id);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  // File handlers
  ipcMain.handle(
    FILE_EVENTS.CREATE,
    async (
      event,
      file_id: string,
      subject_id: string,
      filename: string,
      filepath: string,
    ) => {
      try {
        const file = await DatabaseService.createFile(
          file_id,
          subject_id,
          filename,
          filepath,
        );
        return { success: true, data: file };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(FILE_EVENTS.GET_ALL, async (event, subject_id?: string) => {
    try {
      const files = await DatabaseService.getFiles(subject_id);
      return { success: true, data: files };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(FILE_EVENTS.GET_ONE, async (event, file_id: string) => {
    try {
      const file = await DatabaseService.getFile(file_id);
      return { success: true, data: file };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    FILE_EVENTS.UPDATE,
    async (event, file_id: string, updates: any) => {
      try {
        const result = await DatabaseService.updateFile(file_id, updates);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(FILE_EVENTS.DELETE, async (event, file_id: string) => {
    try {
      const result = await DatabaseService.deleteFile(file_id);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  // Question handlers
  ipcMain.handle(
    QUESTION_EVENTS.CREATE,
    async (
      event,
      question_id: string,
      subject_id: string,
      difficulty: string,
      content: string,
      options_json: string,
      tags?: string[],
    ) => {
      try {
        const question = await DatabaseService.createQuestion(
          question_id,
          subject_id,
          difficulty as any,
          content,
          options_json,
          tags,
        );
        return { success: true, data: question };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    QUESTION_EVENTS.GET_ALL,
    async (event, subject_id?: string, difficulty?: string) => {
      try {
        const questions = await DatabaseService.getQuestions(
          subject_id,
          difficulty,
        );
        return { success: true, data: questions };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    QUESTION_EVENTS.GET_ONE,
    async (event, question_id: string) => {
      try {
        const question = await DatabaseService.getQuestion(question_id);
        return { success: true, data: question };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    QUESTION_EVENTS.UPDATE,
    async (event, question_id: string, updates: any) => {
      try {
        const result = await DatabaseService.updateQuestion(
          question_id,
          updates,
        );
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(QUESTION_EVENTS.DELETE, async (event, question_id: string) => {
    try {
      const result = await DatabaseService.deleteQuestion(question_id);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  // Tag handlers
  ipcMain.handle(TAG_EVENTS.CREATE, async (event, name: string) => {
    try {
      const tag = await DatabaseService.createTag(name);
      return { success: true, data: tag };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(TAG_EVENTS.GET_ALL, async () => {
    try {
      const tags = await DatabaseService.getTags();
      return { success: true, data: tags };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    TAG_EVENTS.ADD_TO_QUESTION,
    async (event, question_id: string, tagNames: string[]) => {
      try {
        await DatabaseService.addTagsToQuestion(question_id, tagNames);
        return { success: true };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    TAG_EVENTS.REMOVE_FROM_QUESTION,
    async (event, question_id: string, tag_id: number) => {
      try {
        const result = await DatabaseService.removeTagFromQuestion(
          question_id,
          tag_id,
        );
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  // Embedding handlers
  ipcMain.handle(
    EMBEDDING_EVENTS.ADD,
    async (
      event,
      chunk_id: string,
      subject_id: string,
      file_id: string,
      chunk_index: number,
      text: string,
      embedding: number[],
    ) => {
      try {
        await DatabaseService.addEmbedding(
          chunk_id,
          subject_id,
          file_id,
          chunk_index,
          text,
          embedding,
        );
        return { success: true };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    EMBEDDING_EVENTS.SEARCH_SIMILAR,
    async (
      event,
      queryEmbedding: number[],
      limit: number = 10,
      subject_id?: string,
    ) => {
      try {
        const results = await DatabaseService.searchSimilar(
          queryEmbedding,
          limit,
          subject_id,
        );
        return { success: true, data: results };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    EMBEDDING_EVENTS.GET_BY_FILE,
    async (event, file_id: string) => {
      try {
        const embeddings = await DatabaseService.getEmbeddingsByFile(file_id);
        return { success: true, data: embeddings };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    EMBEDDING_EVENTS.GET_BY_SUBJECT,
    async (event, subject_id: string) => {
      try {
        const embeddings =
          await DatabaseService.getEmbeddingsBySubject(subject_id);
        return { success: true, data: embeddings };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  // File upload and process handler
  ipcMain.handle(
    FILE_SYSTEM_EVENTS.UPLOAD_AND_PROCESS,
    async (event, filePath: string, subjectId: string) => {
      try {
        console.log('=== File Upload Request ===');
        console.log('File upload request:', {
          filePath,
          subjectId,
        });

        const originalFilename = path.basename(filePath);

        const doc = await FileManager.loadFile(filePath);

        console.log('doc', doc);

        return;

        if (doc.length > 0) {
          const embeddings = await FileManager.embed(doc);
          return;
        }

        return;

        // Store the file using FileManager
        const fileInfo = await FileManager.storeFile(
          filePath,
          subjectId,
          originalFilename,
        );

        console.log('File stored successfully:', fileInfo);

        // Create file record in database
        const file_id = `file_${Date.now()}_${originalFilename.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const dbResult = await DatabaseService.createFile(
          file_id,
          subjectId,
          originalFilename,
          fileInfo.relativePath,
        );

        if (dbResult) {
          console.log('File record created in database:', dbResult);
          return {
            success: true,
            data: {
              ...dbResult,
              size: fileInfo.size,
              storedPath: fileInfo.storedPath,
            },
          };
        } else {
          // If database creation failed, clean up the stored file
          await FileManager.deleteFile(fileInfo.relativePath);
          return {
            success: false,
            error: 'Failed to create file record in database',
          };
        }
      } catch (error) {
        console.error('File upload error:', error);
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(FILE_SYSTEM_EVENTS.GET_STORAGE_PATH, async () => {
    try {
      const storagePath = FileManager.getStoragePath();
      return { success: true, data: storagePath };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    FILE_SYSTEM_EVENTS.GET_ABSOLUTE_PATH,
    async (event, relativePath: string) => {
      try {
        const absolutePath = FileManager.getAbsolutePath(relativePath);
        return { success: true, data: absolutePath };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    FILE_SYSTEM_EVENTS.EXISTS,
    async (event, relativePath: string) => {
      try {
        const exists = await FileManager.fileExists(relativePath);
        return { success: true, data: exists };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    FILE_SYSTEM_EVENTS.GET_INFO,
    async (event, relativePath: string) => {
      try {
        const info = await FileManager.getFileInfo(relativePath);
        return { success: true, data: info };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(FILE_SYSTEM_EVENTS.CHECK_INITIALIZATION, async () => {
    try {
      const storagePath = FileManager.getStoragePath();
      const isInitialized = !!storagePath; // FileManager is initialized if it has a storage path
      return {
        success: true,
        data: {
          isInitialized,
          storagePath,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  // Dialog handlers
  ipcMain.handle(DIALOG_EVENTS.SHOW_OPEN_DIALOG, async (event, options) => {
    try {
      const result = await dialog.showOpenDialog(options);
      return result;
    } catch (error) {
      return { canceled: true, filePaths: [] };
    }
  });

  // Download handlers
  ipcMain.handle(
    DOWNLOAD_EVENTS.DOWNLOAD_FILES,
    async (event, urls: string[], folderName?: string) => {
      console.log('IPC: Download files request received:', urls);
      if (folderName) {
        console.log('IPC: Using custom folder:', folderName);
      }

      try {
        const results = await FileManager.downloadFiles(
          urls,
          (progress) => {
            console.log('IPC: Sending progress update:', progress);
            // Send progress updates to renderer with download ID
            event.sender.send(DOWNLOAD_EVENTS.PROGRESS, progress);
          },
          folderName,
        );

        console.log('IPC: Download results:', results);
        return { success: true, data: results };
      } catch (error) {
        console.error('IPC: Download error:', error);
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(DOWNLOAD_EVENTS.GET_DOWNLOADED_FILES, async () => {
    try {
      const files = await FileManager.getDownloadedFiles();
      return { success: true, data: files };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    DOWNLOAD_EVENTS.DELETE_DOWNLOADED_FILE,
    async (event, filename: string) => {
      try {
        const success = await FileManager.deleteDownloadedFile(filename);
        return { success, data: { deleted: success } };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(DOWNLOAD_EVENTS.GET_DOWNLOADS_PATH, async () => {
    try {
      const downloadsPath = FileManager.getDownloadsPath();
      return { success: true, data: downloadsPath };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  // LLM handlers
  ipcMain.handle(LLM_EVENTS.CHECK_OLLAMA_INSTALLED, async () => {
    try {
      const isInstalled = await LLMService.isOllamaInstalled();
      return { success: true, data: isInstalled };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(LLM_EVENTS.START_OLLAMA, async () => {
    try {
      const result = await LLMService.startOllama();
      return result;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(LLM_EVENTS.DOWNLOAD_OLLAMA, async (event) => {
    try {
      const result = await LLMService.downloadOllama((progress) => {
        event.sender.send(LLM_EVENTS.PROGRESS, progress);
      });
      return result;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    LLM_EVENTS.CHECK_MODEL_INSTALLED,
    async (event, modelName: string) => {
      try {
        const isInstalled = await LLMService.isModelInstalled(modelName);
        return { success: true, data: isInstalled };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(LLM_EVENTS.GET_AVAILABLE_MODELS, async () => {
    try {
      const result = await LLMService.getAvailableModels();
      return result;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(LLM_EVENTS.GET_MODEL_NAME, async () => {
    try {
      const modelName = LLMService.getModelName();
      return { success: true, data: modelName };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(LLM_EVENTS.GET_EMBEDDING_MODEL_NAME, async () => {
    try {
      const modelName = LLMService.getEmbeddingModelName();
      return { success: true, data: modelName };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    LLM_EVENTS.DOWNLOAD_MODEL,
    async (event, modelName: string) => {
      try {
        const result = await LLMService.downloadModel(modelName, (progress) => {
          event.sender.send(LLM_EVENTS.PROGRESS, progress);
        });
        return result;
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(LLM_EVENTS.START_CHAT, async (event, model: string) => {
    try {
      const sessionId = LLMService.createChatSession(model);
      return { success: true, data: sessionId };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    LLM_EVENTS.SEND_MESSAGE,
    async (event, message: string, sessionId?: string) => {
      try {
        const result = await LLMService.sendMessage(
          message,
          sessionId,
          (chunk) => {
            event.sender.send(LLM_EVENTS.STREAM_RESPONSE, {
              sessionId: sessionId || LLMService.getCurrentSession()?.id,
              chunk,
            });
          },
        );
        return result;
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    LLM_EVENTS.GET_CHAT_HISTORY,
    async (event, sessionId?: string) => {
      try {
        const history = LLMService.getChatHistory(sessionId);
        return { success: true, data: history };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(
    LLM_EVENTS.CLEAR_CHAT_HISTORY,
    async (event, sessionId?: string) => {
      try {
        LLMService.clearChatHistory(sessionId);
        return { success: true };
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  ipcMain.handle(LLM_EVENTS.STOP_CHAT, async () => {
    try {
      await LLMService.stopOllama();
      return { success: true };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  // Embedding model handlers
  ipcMain.handle(LLM_EVENTS.CHECK_EMBEDDING_MODEL_INSTALLED, async () => {
    try {
      const isInstalled = await LLMService.isEmbeddingModelInstalled();
      return { success: true, data: isInstalled };
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(LLM_EVENTS.DOWNLOAD_EMBEDDING_MODEL, async (event) => {
    try {
      const result = await LLMService.downloadEmbeddingModel((progress) => {
        event.sender.send(LLM_EVENTS.PROGRESS, progress);
      });
      return result;
    } catch (error) {
      return { success: false, error: handleError(error) };
    }
  });

  ipcMain.handle(
    LLM_EVENTS.CREATE_EMBEDDING,
    async (event, input: string | string[]) => {
      try {
        const result = await LLMService.createEmbedding(input);
        return result;
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );

  // Generate handler
  ipcMain.handle(
    LLM_EVENTS.GENERATE,
    async (event, prompt: GenerateRequest) => {
      try {
        const result = await LLMService.generate(prompt);
        return result;
      } catch (error) {
        return { success: false, error: handleError(error) };
      }
    },
  );
}
