import React, { useState, useEffect } from 'react';
import { useDatabase } from './database/useDatabase';
import { useFiles } from './files/useFiles';

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

export default function ExampleDashboard() {
  const db = useDatabase();
  const fileOps = useFiles();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Auto-select first subject when subjects are loaded
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].subject_id);
    }
  }, [subjects, selectedSubject]);

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
        'Are you sure you want to delete this subject? This will also delete all associated files and questions.',
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

  const handleFileUpload = async (subjectId: string) => {
    if (!subjectId) {
      setError('Please select a subject first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the file dialog to select a file
      const { canceled, filePaths } =
        await window.electron.dialog.showOpenDialog();

      if (canceled) return;

      const src = filePaths[0];

      const result = await fileOps.uploadFile(src, subjectId);

      if (result.success) {
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Subject & File Management Dashboard</h1>

      {error && (
        <div
          style={{
            color: 'red',
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#ffe6e6',
            borderRadius: '4px',
            border: '1px solid #ffcccc',
          }}
        >
          Error: {error}
        </div>
      )}

      {/* Create New Subject Section */}
      <div
        style={{
          marginBottom: '30px',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa',
        }}
      >
        <h3>Create New Subject</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            placeholder="Enter subject name..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateSubject()}
          />
          <button
            onClick={handleCreateSubject}
            disabled={loading || !newSubjectName.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: loading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {loading ? 'Creating...' : 'Create Subject'}
          </button>
        </div>
      </div>

      {/* Subjects and Files Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '20px',
        }}
      >
        {/* Subjects List */}
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: 'white',
          }}
        >
          <h3>Subjects ({subjects.length})</h3>
          {subjects.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              No subjects created yet. Create your first subject above.
            </p>
          ) : (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {subjects.map((subject) => (
                <div
                  key={subject.subject_id}
                  style={{
                    padding: '12px',
                    border:
                      selectedSubject === subject.subject_id
                        ? '2px solid #007bff'
                        : '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor:
                      selectedSubject === subject.subject_id
                        ? '#f0f8ff'
                        : '#f8f9fa',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setSelectedSubject(subject.subject_id)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color:
                          selectedSubject === subject.subject_id
                            ? '#007bff'
                            : '#333',
                      }}
                    >
                      {subject.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubject(subject.subject_id);
                      }}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {getFilesBySubject(subject.subject_id).length} files
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Files Section */}
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: 'white',
          }}
        >
          {selectedSubject ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h3>
                  Files in "
                  {subjects.find((s) => s.subject_id === selectedSubject)?.name}
                  " ({getFilesBySubject(selectedSubject).length})
                </h3>
                <button
                  onClick={() => handleFileUpload(selectedSubject)}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: loading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {loading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>

              {getFilesBySubject(selectedSubject).length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#666',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '2px dashed #ddd',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                    📁
                  </div>
                  <p style={{ margin: '0', fontSize: '16px' }}>
                    No files uploaded yet for this subject.
                  </p>
                  <p
                    style={{
                      margin: '10px 0 0 0',
                      fontSize: '14px',
                      color: '#999',
                    }}
                  >
                    Click "Upload File" to add your first file.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {getFilesBySubject(selectedSubject).map((file) => (
                    <div
                      key={file.file_id}
                      style={{
                        padding: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#f8f9fa',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 'bold',
                            marginBottom: '5px',
                            fontSize: '14px',
                          }}
                        >
                          📄 {file.filename}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#666',
                            wordBreak: 'break-all',
                          }}
                        >
                          Path: {file.filepath}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file.file_id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📚</div>
              <p style={{ margin: '0', fontSize: '16px' }}>
                Select a subject to view and manage its files.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: '10px' }}>⏳</div>
            <div>Loading...</div>
          </div>
        </div>
      )}
    </div>
  );
}
