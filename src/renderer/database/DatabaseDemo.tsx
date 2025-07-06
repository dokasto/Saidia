import React, { useState, useEffect } from 'react';
import { useDatabase } from './useDatabase';
import { useFiles } from '../files/useFiles';
import { useLLM } from '../llm/useLLM';

interface Subject {
  subject_id: string;
  name: string;
  files?: File[];
  questions?: any[];
}

interface File {
  file_id: string;
  subject_id: string;
  filename: string;
  filepath: string;
  subject?: Subject;
}

export const DatabaseDemo: React.FC = () => {
  const db = useDatabase();
  const fileOps = useFiles();
  const {
    isOllamaInstalled,
    isOllamaRunning,
    isEmbeddingModelInstalled,
    startOllama,
    downloadEmbeddingModel,
    checkOllamaInstalled,
    checkEmbeddingModelInstalled,
    isLoading: llmLoading,
    error: llmError,
  } = useLLM();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [vectorVersion, setVectorVersion] = useState<string>('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(
    null,
  );
  const [selectedSubjectForUpload, setSelectedSubjectForUpload] =
    useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'subjects' | 'files' | 'dashboard'
  >('files');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data and auto-start Ollama
  useEffect(() => {
    loadData();
    autoStartOllama();
  }, []);

  // Auto-start Ollama and download embedding model
  const autoStartOllama = async () => {
    try {
      console.log('Starting auto-setup process...');

      // Step 1: Check if Ollama is installed
      await checkOllamaInstalled();

      // Step 2: Wait a moment and then start Ollama if needed
      setTimeout(async () => {
        try {
          // Try to start Ollama (it will fail gracefully if already running)
          console.log('Attempting to start Ollama...');
          await startOllama();

          // Step 3: Wait for Ollama to start, then check embedding model
          setTimeout(async () => {
            try {
              await checkEmbeddingModelInstalled();

              // Step 4: Wait a moment and then download embedding model if needed
              setTimeout(async () => {
                try {
                  console.log('Attempting to download embedding model...');
                  await downloadEmbeddingModel();
                } catch (error) {
                  console.log(
                    'Embedding model download failed or already installed:',
                    error,
                  );
                }
              }, 2000);
            } catch (error) {
              console.log('Embedding model check failed:', error);
            }
          }, 3000);
        } catch (error) {
          console.log('Ollama start failed or already running:', error);

          // If Ollama start failed, still try to check embedding model
          setTimeout(async () => {
            try {
              await checkEmbeddingModelInstalled();

              setTimeout(async () => {
                try {
                  console.log('Attempting to download embedding model...');
                  await downloadEmbeddingModel();
                } catch (error) {
                  console.log(
                    'Embedding model download failed or already installed:',
                    error,
                  );
                }
              }, 2000);
            } catch (error) {
              console.log('Embedding model check failed:', error);
            }
          }, 2000);
        }
      }, 1000);
    } catch (error) {
      console.error('Error in auto-start process:', error);
    }
  };

  // Auto-select first subject when subjects are loaded
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectForUpload) {
      setSelectedSubjectForUpload(subjects[0].subject_id);
    }
  }, [subjects, selectedSubjectForUpload]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get subjects
      const subjectsResult = await db.getSubjects();
      if (subjectsResult.success) {
        setSubjects(subjectsResult.data || []);
      } else {
        setError(`Failed to load subjects: ${subjectsResult.error}`);
      }

      // Get files
      const filesResult = await db.getFiles();
      if (filesResult.success) {
        setFiles(filesResult.data || []);
      } else {
        setError(`Failed to load files: ${filesResult.error}`);
      }

      // Get vector database version
      const versionResult = await db.getVectorDbVersion();
      if (versionResult.success) {
        setVectorVersion(versionResult.data || 'Unknown');
      }
    } catch (err) {
      setError(`Error loading data: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const subject_id = `subject_${Date.now()}`;
      const result = await db.createSubject(subject_id, newSubjectName.trim());

      if (result.success) {
        setNewSubjectName('');
        await loadData(); // Reload data
      } else {
        setError(`Failed to create subject: ${result.error}`);
      }
    } catch (err) {
      setError(`Error creating subject: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subject_id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this subject? This will also delete all associated files, questions, and embeddings.',
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await db.deleteSubject(subject_id);

      if (result.success) {
        await loadData(); // Reload data
      } else {
        setError(`Failed to delete subject: ${result.error}`);
      }
    } catch (err) {
      setError(`Error deleting subject: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    console.log('handleFileUpload');
    if (!selectedSubjectForUpload) {
      setError('Please select both a file and a subject');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Uploading file...');
      // Use the new file upload system that properly stores files
      const { canceled, filePaths } =
        await window.electron.dialog.showOpenDialog();

      if (canceled) return;

      const src = filePaths[0];

      const result = await fileOps.uploadFile(src, selectedSubjectForUpload);

      if (result.success) {
        setSelectedFile(null);
        setSelectedSubjectForUpload('');
        await loadData(); // Reload data
        alert(
          `File uploaded successfully! Size: ${Math.round(result.data.size / 1024)} KB`,
        );
      } else {
        setError(`Failed to upload file: ${result.error}`);
      }
    } catch (err) {
      setError(`Error uploading file: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (file_id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await db.deleteFile(file_id);

      if (result.success) {
        await loadData(); // Reload data
      } else {
        setError(`Failed to delete file: ${result.error}`);
      }
    } catch (err) {
      setError(`Error deleting file: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const getFilesBySubject = (subject_id: string) => {
    return files.filter((file) => file.subject_id === subject_id);
  };

  const testVectorSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create a sample embedding (normally you'd get this from an embedding model)
      const sampleEmbedding = Array.from(
        { length: 384 },
        () => Math.random() - 0.5,
      );

      // Add a test embedding
      await db.addEmbedding(
        `test_chunk_${Date.now()}`,
        subjects[0]?.subject_id || 'test_subject',
        'test_file',
        0,
        'This is a test text chunk for vector search',
        sampleEmbedding,
      );

      // Search for similar embeddings
      const searchResult = await db.searchSimilar(sampleEmbedding, 5);

      if (searchResult.success) {
        alert(`Found ${searchResult.data?.length || 0} similar embeddings!`);
      } else {
        setError(`Vector search failed: ${searchResult.error}`);
      }
    } catch (err) {
      setError(`Error testing vector search: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Database Demo</h1>

      {/* Ollama Management Section */}
      <div
        style={{
          marginBottom: '30px',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa',
        }}
      >
        <h3>Ollama Management</h3>
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '15px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: isOllamaInstalled ? '#28a745' : '#dc3545',
              color: 'white',
            }}
          >
            Ollama: {isOllamaInstalled ? 'Installed' : 'Not Installed'}
          </div>
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: isOllamaRunning ? '#28a745' : '#ffc107',
              color: isOllamaRunning ? 'white' : 'black',
            }}
          >
            Status: {isOllamaRunning ? 'Running' : 'Stopped'}
          </div>
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: isEmbeddingModelInstalled
                ? '#28a745'
                : '#dc3545',
              color: 'white',
            }}
          >
            Embedding Model:{' '}
            {isEmbeddingModelInstalled ? 'Installed' : 'Not Installed'}
          </div>
        </div>

        <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
          {!isOllamaInstalled && (
            <p>
              • Ollama needs to be installed first. Use the Download Demo page
              to install Ollama.
            </p>
          )}
          {isOllamaInstalled && !isOllamaRunning && (
            <p>
              • Ollama is installed but not running. Click "Start Ollama" to
              start the service.
            </p>
          )}
          {isOllamaRunning && !isEmbeddingModelInstalled && (
            <p>
              • Ollama is running! Now download the embedding model to enable
              text processing features.
            </p>
          )}
          {isOllamaRunning && isEmbeddingModelInstalled && (
            <p>
              • Perfect! Ollama is running and the embedding model is ready. You
              can now use text processing features.
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              checkOllamaInstalled();
              checkEmbeddingModelInstalled();
            }}
            disabled={llmLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: llmLoading ? '#ccc' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: llmLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {llmLoading ? 'Checking...' : 'Refresh Status'}
          </button>

          {!isOllamaRunning && (
            <button
              onClick={startOllama}
              disabled={llmLoading || !isOllamaInstalled}
              style={{
                padding: '8px 16px',
                backgroundColor:
                  llmLoading || !isOllamaInstalled ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor:
                  llmLoading || !isOllamaInstalled ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              {llmLoading ? 'Starting...' : 'Start Ollama'}
            </button>
          )}

          {isOllamaRunning && !isEmbeddingModelInstalled && (
            <button
              onClick={downloadEmbeddingModel}
              disabled={llmLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: llmLoading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: llmLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              {llmLoading ? 'Downloading...' : 'Download Embedding Model'}
            </button>
          )}

          {isOllamaRunning && isEmbeddingModelInstalled && (
            <div
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              ✓ All Ready
            </div>
          )}
        </div>

        {llmError && (
          <div style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
            Error: {llmError}
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            background: '#fee',
            border: '1px solid #fcc',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <p>
          <strong>sqlite-vec version:</strong> {vectorVersion}
        </p>
        <p>
          <strong>Total subjects:</strong> {subjects.length} |{' '}
          <strong>Total files:</strong> {files.length}
        </p>
        <button
          onClick={async () => {
            const result = await fileOps.checkFileManagerInitialization();
            if (result.success) {
              alert(
                `FileManager Status:\nInitialized: ${result.data.isInitialized}\nStorage Path: ${result.data.storagePath}\nChecked at: ${result.data.timestamp}`,
              );
            } else {
              alert(`Error checking FileManager: ${result.error}`);
            }
          }}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#e9ecef',
            cursor: 'pointer',
            fontSize: '12px',
            marginTop: '10px',
          }}
        >
          Check FileManager Status
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {(['subjects', 'files', 'dashboard'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom:
                  activeTab === tab
                    ? '2px solid #007bff'
                    : '2px solid transparent',
                background: activeTab === tab ? '#f8f9fa' : 'transparent',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontSize: '16px',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2>Create New Subject</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Enter subject name"
                disabled={loading}
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              />
              <button
                onClick={handleCreateSubject}
                disabled={loading || !newSubjectName.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#007bff',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Creating...' : 'Create Subject'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h2>Subjects</h2>
            {subjects.length === 0 ? (
              <p>No subjects found. Create one above!</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {subjects.map((subject) => (
                  <li
                    key={subject.subject_id}
                    style={{
                      border: '1px solid #ddd',
                      padding: '10px',
                      marginBottom: '10px',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong>{subject.name}</strong>
                      <br />
                      <small>ID: {subject.subject_id}</small>
                      <br />
                      <small>
                        Files: {getFilesBySubject(subject.subject_id).length},
                        Questions: {subject.questions?.length || 0}
                      </small>
                    </div>
                    <button
                      onClick={() => handleDeleteSubject(subject.subject_id)}
                      disabled={loading}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        background: '#dc3545',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Files Tab */}
      {activeTab === 'files' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2>Upload File</h2>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div>
                <label
                  htmlFor="subject-select"
                  style={{ display: 'block', marginBottom: '5px' }}
                >
                  Select Subject:
                </label>
                <select
                  id="subject-select"
                  value={selectedSubjectForUpload}
                  onChange={(e) => setSelectedSubjectForUpload(e.target.value)}
                  disabled={loading}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    width: '100%',
                  }}
                >
                  <option value="">Choose a subject...</option>
                  {subjects.map((subject) => (
                    <option key={subject.subject_id} value={subject.subject_id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleFileUpload}
                disabled={loading || !selectedSubjectForUpload}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#28a745',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                {loading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h2>All Files</h2>
            {files.length === 0 ? (
              <p>No files found. Upload one above!</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {files.map((file) => {
                  const subject = subjects.find(
                    (s) => s.subject_id === file.subject_id,
                  );
                  return (
                    <li
                      key={file.file_id}
                      style={{
                        border: '1px solid #ddd',
                        padding: '10px',
                        marginBottom: '10px',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong>{file.filename}</strong>
                        <br />
                        <small>Subject: {subject?.name || 'Unknown'}</small>
                        <br />
                        <small>ID: {file.file_id}</small>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file.file_id)}
                        disabled={loading}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          background: '#dc3545',
                          color: 'white',
                          cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div>
          <h2>Dashboard</h2>
          {subjects.length === 0 ? (
            <p>No subjects found. Create subjects first!</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
              }}
            >
              {subjects.map((subject) => {
                const subjectFiles = getFilesBySubject(subject.subject_id);
                return (
                  <div
                    key={subject.subject_id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '16px',
                      background: '#f9f9f9',
                    }}
                  >
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                      {subject.name}
                    </h3>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Files ({subjectFiles.length}):</strong>
                    </div>
                    {subjectFiles.length === 0 ? (
                      <p style={{ color: '#666', fontStyle: 'italic' }}>
                        No files uploaded yet
                      </p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {subjectFiles.map((file) => (
                          <li
                            key={file.file_id}
                            style={{
                              background: 'white',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              padding: '8px',
                              marginBottom: '5px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ fontSize: '14px' }}>
                              {file.filename}
                            </span>
                            <button
                              onClick={() => handleDeleteFile(file.file_id)}
                              disabled={loading}
                              style={{
                                padding: '2px 6px',
                                borderRadius: '3px',
                                border: 'none',
                                background: '#dc3545',
                                color: 'white',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div
                      style={{
                        marginTop: '10px',
                        fontSize: '14px',
                        color: '#666',
                      }}
                    >
                      Questions: {subject.questions?.length || 0}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Common Actions */}
      <div
        style={{
          marginTop: '30px',
          borderTop: '1px solid #ddd',
          paddingTop: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: '#f8f9fa',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>

          {subjects.length > 0 && (
            <button
              onClick={testVectorSearch}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: '#6f42c1',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Testing...' : 'Test Vector Search'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
