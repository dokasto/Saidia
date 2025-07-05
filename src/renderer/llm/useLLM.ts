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
      const result = await window.electron.ipcRenderer.invoke(
        LLM_EVENTS.GET_MODEL_NAME,
      );
      if (result.success) {
        return result.data;
      }
    } catch (error) {
      console.error('Failed to get model name:', error);
    }
    return 'hf.co/unsloth/gemma-3n-E4B-it-GGUF:F16'; // fallback
  }, []);

  // Check if Ollama is installed
  const checkOllamaInstalled = useCallback(async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        LLM_EVENTS.CHECK_OLLAMA_INSTALLED,
      );
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
      const result = await window.electron.ipcRenderer.invoke(
        LLM_EVENTS.CHECK_MODEL_INSTALLED,
        modelName, // If no model name provided, service will use the fixed model
      );
      if (result.success) {
        setState((prev) => ({ ...prev, isModelInstalled: result.data }));
      }
    } catch (error) {
      console.error('Failed to check model installation:', error);
    }
  }, []);

  // Get available models
  const getAvailableModels = useCallback(async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        LLM_EVENTS.GET_AVAILABLE_MODELS,
      );
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
      const result = await window.electron.ipcRenderer.invoke(
        LLM_EVENTS.START_OLLAMA,
      );

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
      const result = await window.electron.ipcRenderer.invoke(
        LLM_EVENTS.DOWNLOAD_OLLAMA,
      );

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
      const result = await window.electron.ipcRenderer.invoke(
        LLM_EVENTS.DOWNLOAD_MODEL,
        modelName, // If no model name provided, service will use the fixed model
      );

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

  // Start a chat session (no model parameter needed since it's fixed)
  const startChat = useCallback(async (model?: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await window.electron.ipcRenderer.invoke(
        LLM_EVENTS.START_CHAT,
        model, // Service will use the fixed model
      );

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
        const result = await window.electron.ipcRenderer.invoke(
          LLM_EVENTS.SEND_MESSAGE,
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
      const result = await window.electron.ipcRenderer.invoke(
        LLM_EVENTS.GET_CHAT_HISTORY,
        sessionId,
      );

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
      const result = await window.electron.ipcRenderer.invoke(
        LLM_EVENTS.CLEAR_CHAT_HISTORY,
        sessionId,
      );

      if (result.success) {
        setState((prev) => ({ ...prev, messages: [] }));
      }
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  }, []);

  // Set up event listeners for progress and streaming
  useEffect(() => {
    const handleProgress = (...args: unknown[]) => {
      const progress = args[0] as DownloadProgress;
      setState((prev) => ({ ...prev, downloadProgress: progress }));
    };

    const handleStreamResponse = (...args: unknown[]) => {
      const data = args[0] as { sessionId: string; chunk: string };
      setState((prev) => ({
        ...prev,
        streamingMessage: prev.streamingMessage + data.chunk,
      }));
    };

    // Add event listeners
    window.electron.ipcRenderer.on(LLM_EVENTS.PROGRESS, handleProgress);
    window.electron.ipcRenderer.on(
      LLM_EVENTS.STREAM_RESPONSE,
      handleStreamResponse,
    );

    // Cleanup
    return () => {
      window.electron.ipcRenderer.removeAllListeners(LLM_EVENTS.PROGRESS);
      window.electron.ipcRenderer.removeAllListeners(
        LLM_EVENTS.STREAM_RESPONSE,
      );
    };
  }, []);

  // Initialize by checking Ollama installation
  useEffect(() => {
    checkOllamaInstalled();
  }, [checkOllamaInstalled]);

  return {
    // State
    ...state,

    // Actions
    checkOllamaInstalled,
    checkModelInstalled,
    getAvailableModels,
    getModelName,
    startOllama,
    downloadOllama,
    downloadModel,
    startChat,
    sendMessage,
    loadChatHistory,
    clearChatHistory,
  };
}
