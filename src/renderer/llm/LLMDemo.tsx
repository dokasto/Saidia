import React, { useState, useEffect } from 'react';
import { useLLM } from './useLLM';

export function LLMDemo() {
  const {
    isOllamaInstalled,
    isOllamaRunning,
    isModelInstalled,
    currentSessionId,
    messages,
    isLoading,
    error,
    downloadProgress,
    streamingMessage,
    availableModels,
    downloadOllama,
    downloadModel,
    startOllama,
    getAvailableModels,
    getModelName,
    startChat,
    sendMessage,
    clearChatHistory,
    checkModelInstalled,
  } = useLLM();

  const [inputMessage, setInputMessage] = useState('');
  const [modelName, setModelName] = useState('Loading...');

  // Get the fixed model name on component mount
  useEffect(() => {
    const loadModelName = async () => {
      const name = await getModelName();
      setModelName(name);
    };
    loadModelName();
  }, [getModelName]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSessionId) return;

    await sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleStartChat = async () => {
    await startChat();
  };

  const handleDownloadModel = async () => {
    await downloadModel();
  };

  const handleCheckModel = async () => {
    await checkModelInstalled();
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getShortModelName = (fullName: string) => {
    // Extract a shorter, more readable name from the full model name
    if (fullName.includes('gemma-3n-E4B-it-GGUF')) {
      return 'Gemma 3N E4B (GGUF)';
    }
    return fullName;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">LLM Demo</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Download Progress */}
      {downloadProgress && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center mb-2">
            <span>
              Downloading {downloadProgress.type}: {downloadProgress.filename}
            </span>
            <span>{downloadProgress.percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress.percentage}%` }}
            />
          </div>
          <div className="text-sm mt-1">Status: {downloadProgress.status}</div>
        </div>
      )}

      {/* Setup Section */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Setup</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <h3 className="font-medium mb-2">Ollama Status</h3>
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isOllamaInstalled ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span>{isOllamaInstalled ? 'Installed' : 'Not Installed'}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isOllamaRunning ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <span>{isOllamaRunning ? 'Running' : 'Stopped'}</span>
            </div>
            {!isOllamaInstalled && (
              <button
                onClick={downloadOllama}
                disabled={isLoading}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Downloading...' : 'Download Ollama'}
              </button>
            )}
            {isOllamaInstalled && !isOllamaRunning && (
              <button
                onClick={startOllama}
                disabled={isLoading}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Starting...' : 'Start Ollama'}
              </button>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-2">Model Status</h3>
            <div className="mb-2">
              <div className="text-sm text-gray-600 mb-1">Current Model:</div>
              <div className="text-sm font-mono bg-gray-200 p-2 rounded">
                {getShortModelName(modelName)}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={handleCheckModel}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                Check Status
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isModelInstalled ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span>{isModelInstalled ? 'Ready' : 'Not Available'}</span>
            </div>
            {!isModelInstalled && (
              <button
                onClick={handleDownloadModel}
                disabled={isLoading || !isOllamaRunning}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Downloading...' : 'Download Model'}
              </button>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-2">Available Models</h3>
            <div className="max-h-24 overflow-y-auto">
              {isOllamaRunning ? (
                availableModels.length > 0 ? (
                  <div className="space-y-1">
                    {availableModels.map((model, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {model.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No models installed
                  </div>
                )
              ) : (
                <div className="text-sm text-gray-500">
                  Start Ollama to see models
                </div>
              )}
            </div>
            {isOllamaRunning && (
              <button
                onClick={getAvailableModels}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Refresh
              </button>
            )}
          </div>
        </div>

        {isOllamaInstalled && isOllamaRunning && !currentSessionId && (
          <button
            onClick={handleStartChat}
            disabled={isLoading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Start Chat Session
          </button>
        )}
      </div>

      {/* Chat Section */}
      {currentSessionId && (
        <div className="bg-white border rounded-lg">
          <div className="border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Chat with {getShortModelName(modelName)}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => clearChatHistory()}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                Clear History
              </button>
              <span className="text-sm text-gray-500">
                Session: {currentSessionId.slice(-8)}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                  <div className="text-sm">{streamingMessage}</div>
                  <div className="text-xs opacity-70 mt-1">
                    <span className="animate-pulse">Typing...</span>
                  </div>
                </div>
              </div>
            )}

            {isLoading && !streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                  <div className="text-sm">
                    <span className="animate-pulse">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-medium mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>First, download Ollama if not already installed</li>
          <li>Start Ollama (this will automatically load the model)</li>
          <li>Start a chat session to begin talking with the AI</li>
          <li>Type messages and see the AI respond in real-time</li>
        </ol>
        <p className="mt-2 text-xs">
          Note: The model ({getShortModelName(modelName)}) will be automatically
          downloaded when you start Ollama if it's not already available.
        </p>
      </div>
    </div>
  );
}
