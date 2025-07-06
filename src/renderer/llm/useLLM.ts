import { useState, useEffect, useCallback } from 'react';
import { LLM_EVENTS } from '../../constants/events';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface DownloadProgress {
  type: 'ollama' | 'model';
  filename: string;
  downloaded: number;
  total: number;
  percentage: number;
  status: 'starting' | 'downloading' | 'completed' | 'error';
}

export interface LLMState {
  isOllamaInstalled: boolean;
  isOllamaRunning: boolean;
  isModelInstalled: boolean;
  isEmbeddingModelInstalled: boolean;
  currentSessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  downloadProgress: DownloadProgress | null;
  streamingMessage: string;
  availableModels: any[];
}

export function useLLM() {
  const [state, setState] = useState<LLMState>({
    isOllamaInstalled: false,
    isOllamaRunning: false,
    isModelInstalled: false,
    isEmbeddingModelInstalled: false,
    currentSessionId: null,
    messages: [],
    isLoading: false,
    error: null,
    downloadProgress: null,
    streamingMessage: '',
    availableModels: [],
  });

  // Get the fixed model name from the service
  const getModelName = useCallback(async () => {
    try {
      const result = await window.electron.llm.getModelName();
      if (result.success) {
        return result.data;
      }
    } catch (error) {
      console.error('Failed to get model name:', error);
    }
    return 'hf.co/unsloth/gemma-3n-E4B-it-GGUF:F16'; // fallback
  }, []);

  // Get the fixed embedding model name from the service
  const getEmbeddingModelName = useCallback(async () => {
    try {
      const result = await window.electron.llm.getEmbeddingModelName();
      if (result.success) {
        return result.data;
      }
    } catch (error) {
      console.error('Failed to get embedding model name:', error);
    }
    return 'nomic-embed-text:v1.5'; // fallback
  }, []);

  // Check if Ollama is installed
  const checkOllamaInstalled = useCallback(async () => {
    try {
      const result = await window.electron.llm.checkOllamaInstalled();
      if (result.success) {
        setState((prev) => ({ ...prev, isOllamaInstalled: result.data }));
      }
    } catch (error) {
      console.error('Failed to check Ollama installation:', error);
    }
  }, []);

  // Check if the fixed model is installed
  const checkModelInstalled = useCallback(async (modelName?: string) => {
    try {
      const result = await window.electron.llm.checkModelInstalled(modelName);
      if (result.success) {
        setState((prev) => ({ ...prev, isModelInstalled: result.data }));
      }
    } catch (error) {
      console.error('Failed to check model installation:', error);
    }
  }, []);

  // Check if the embedding model is installed
  const checkEmbeddingModelInstalled = useCallback(async () => {
    try {
      const result = await window.electron.llm.checkEmbeddingModelInstalled();
      if (result.success) {
        setState((prev) => ({
          ...prev,
          isEmbeddingModelInstalled: result.data,
        }));
      }
    } catch (error) {
      console.error('Failed to check embedding model installation:', error);
    }
  }, []);

  // Get available models
  const getAvailableModels = useCallback(async () => {
    try {
      const result = await window.electron.llm.getAvailableModels();
      if (result.success) {
        const models = result.models || [];
        setState((prev) => ({ ...prev, availableModels: models }));
        return models;
      } else {
        console.error('Failed to get available models:', result.error);
        return [];
      }
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  }, []);

  // Start Ollama
  const startOllama = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await window.electron.llm.startOllama();

      if (result.success) {
        setState((prev) => ({
          ...prev,
          isOllamaRunning: true,
          isLoading: false,
        }));
        // Refresh available models when Ollama starts
        await getAvailableModels();
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error || 'Failed to start Ollama',
          isLoading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: String(error),
        isLoading: false,
      }));
    }
  }, [getAvailableModels]);

  // Download Ollama
  const downloadOllama = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await window.electron.llm.downloadOllama();

      if (result.success) {
        setState((prev) => ({
          ...prev,
          isOllamaInstalled: true,
          isLoading: false,
          downloadProgress: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error || 'Download failed',
          isLoading: false,
          downloadProgress: null,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: String(error),
        isLoading: false,
        downloadProgress: null,
      }));
    }
  }, []);

  // Download the fixed model
  const downloadModel = useCallback(async (modelName?: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await window.electron.llm.downloadModel(modelName);

      if (result.success) {
        setState((prev) => ({
          ...prev,
          isModelInstalled: true,
          isLoading: false,
          downloadProgress: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error || 'Model download failed',
          isLoading: false,
          downloadProgress: null,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: String(error),
        isLoading: false,
        downloadProgress: null,
      }));
    }
  }, []);

  // Download the embedding model
  const downloadEmbeddingModel = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await window.electron.llm.downloadEmbeddingModel();

      if (result.success) {
        setState((prev) => ({
          ...prev,
          isEmbeddingModelInstalled: true,
          isLoading: false,
          downloadProgress: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error || 'Embedding model download failed',
          isLoading: false,
          downloadProgress: null,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: String(error),
        isLoading: false,
        downloadProgress: null,
      }));
    }
  }, []);

  // Start a chat session (no model parameter needed since it's fixed)
  const startChat = useCallback(async (model?: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await window.electron.llm.startChat(model);

      if (result.success) {
        setState((prev) => ({
          ...prev,
          currentSessionId: result.data,
          isLoading: false,
          messages: [],
        }));

        // Load chat history
        await loadChatHistory(result.data);
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error || 'Failed to start chat',
          isLoading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: String(error),
        isLoading: false,
      }));
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(
    async (message: string, sessionId?: string) => {
      if (!message.trim()) return;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        streamingMessage: '',
      }));

      try {
        const result = await window.electron.llm.sendMessage(
          message,
          sessionId,
        );

        if (result.success) {
          // Reload chat history to get the updated messages
          await loadChatHistory(
            sessionId || state.currentSessionId || undefined,
          );
          setState((prev) => ({
            ...prev,
            isLoading: false,
            streamingMessage: '',
          }));
        } else {
          setState((prev) => ({
            ...prev,
            error: result.error || 'Failed to send message',
            isLoading: false,
            streamingMessage: '',
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: String(error),
          isLoading: false,
          streamingMessage: '',
        }));
      }
    },
    [state.currentSessionId],
  );

  // Load chat history
  const loadChatHistory = useCallback(async (sessionId?: string) => {
    try {
      const result = await window.electron.llm.getChatHistory(sessionId);

      if (result.success) {
        setState((prev) => ({ ...prev, messages: result.data }));
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, []);

  // Clear chat history
  const clearChatHistory = useCallback(async (sessionId?: string) => {
    try {
      const result = await window.electron.llm.clearChatHistory(sessionId);

      if (result.success) {
        setState((prev) => ({ ...prev, messages: [] }));
      }
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  }, []);

  // Create embedding
  const createEmbedding = useCallback(async (input: string | string[]) => {
    try {
      const result = await window.electron.llm.createEmbedding(input);

      if (result.success) {
        if (Array.isArray(input)) {
          return { success: true, embeddings: result.embeddings };
        } else {
          return { success: true, embedding: result.embedding };
        }
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }, []);

  // Set up event listeners for progress and streaming
  useEffect(() => {
    const handleProgress = (progress: DownloadProgress) => {
      setState((prev) => ({ ...prev, downloadProgress: progress }));
    };

    const handleStreamResponse = (data: {
      sessionId: string;
      chunk: string;
    }) => {
      setState((prev) => ({
        ...prev,
        streamingMessage: prev.streamingMessage + data.chunk,
      }));
    };

    // Add event listeners
    const progressUnsubscribe = window.electron.llm.onProgress(handleProgress);
    const streamUnsubscribe =
      window.electron.llm.onStreamResponse(handleStreamResponse);

    // Cleanup
    return () => {
      progressUnsubscribe();
      streamUnsubscribe();
    };
  }, []);

  // Initialize by checking Ollama installation
  useEffect(() => {
    checkOllamaInstalled();
  }, [checkOllamaInstalled]);

  // Initialize by checking embedding model installation
  useEffect(() => {
    checkEmbeddingModelInstalled();
  }, [checkEmbeddingModelInstalled]);

  return {
    // State
    ...state,

    // Actions
    checkOllamaInstalled,
    checkModelInstalled,
    checkEmbeddingModelInstalled,
    getAvailableModels,
    getModelName,
    getEmbeddingModelName,
    startOllama,
    downloadOllama,
    downloadModel,
    downloadEmbeddingModel,
    startChat,
    sendMessage,
    loadChatHistory,
    clearChatHistory,
    createEmbedding,
  };
}
