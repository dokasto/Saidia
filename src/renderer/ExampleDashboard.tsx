import React, { useState, useEffect } from 'react';
import { useDatabase } from './database/useDatabase';
import { useFiles } from './files/useFiles';
import {
  QuestionDifficulty,
  QuestionType,
  GenerateQuestionOptions,
} from '../constants/types';

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

  // Add print styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .exam-print-section, .exam-print-section * {
          visibility: visible;
        }
        .exam-print-section {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
        .question-card {
          page-break-inside: avoid;
          margin-bottom: 20px;
          padding: 15px;
          background: white;
        }
        .question-text {
          font-size: 14px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .choice {
          margin: 5px 0;
          padding: 5px 10px;
        }
        .choice-horizontal {
          display: inline-block;
          margin-right: 20px;
        }
        .exam-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        .student-info {
          margin-bottom: 20px;
          border: 1px solid #000;
          padding: 10px;
        }
        .answer-indicator {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Question generation state
  const [questionDifficulty, setQuestionDifficulty] =
    useState<QuestionDifficulty>(QuestionDifficulty.MEDIUM);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<QuestionType>(
    QuestionType.MULTIPLE_CHOICE,
  );
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Debug logging for generatedQuestions state
  useEffect(() => {
    console.log('generatedQuestions state changed:', generatedQuestions);
  }, [generatedQuestions]);

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
      const subject_id = `${newSubjectName.trim().toLowerCase()}_${Date.now()}`;
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

  const handleGenerateQuestions = async (subjectId: string) => {
    if (!subjectId) {
      setError('Please select a subject first');
      return;
    }

    const subject = subjects.find((s) => s.subject_id === subjectId);
    if (!subject) {
      setError('Subject not found');
      return;
    }

    setGeneratingQuestions(true);
    setError(null);

    try {
      const options: GenerateQuestionOptions = {
        difficulty: questionDifficulty,
        count: questionCount,
        type: questionType,
      };

      // Call the IPC handler for question generation
      const result = await window.electron.llm.generateQuestions(
        subjectId,
        options,
      );

      console.log('Question generation result:', result);

      if (result.success) {
        console.log('Raw result data:', result.data);
        console.log('Data type:', typeof result.data);
        console.log('Is array:', Array.isArray(result.data));

        // Store the generated questions as an array
        if (result.data && Array.isArray(result.data)) {
          console.log('Setting generated questions:', result.data);
          setGeneratedQuestions(result.data);
        } else if (result.data && typeof result.data === 'object') {
          // If it's a single question object, wrap it in an array
          console.log('Single question object detected, wrapping in array');
          setGeneratedQuestions([result.data]);
        } else {
          console.log('No valid data in result, setting empty array');
          setGeneratedQuestions([]);
        }
        await loadData(); // Reload data to show new questions
      } else {
        console.error('Question generation failed:', result.error);
        setError(`Failed to generate questions: ${result.error}`);
      }
    } catch (err) {
      setError(`Error generating questions: ${(err as Error).message}`);
    } finally {
      setGeneratingQuestions(false);
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

      {/* Question Generation Section */}
      {selectedSubject && (
        <div
          style={{
            marginTop: '20px',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa',
          }}
        >
          <h3>
            Generate Questions for "
            {subjects.find((s) => s.subject_id === selectedSubject)?.name}"
          </h3>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {/* Options Row - Horizontal Layout */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '20px',
                flexWrap: 'wrap',
              }}
            >
              {/* Difficulty Selection */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  Difficulty:
                </label>
                <select
                  value={questionDifficulty}
                  onChange={(e) =>
                    setQuestionDifficulty(e.target.value as QuestionDifficulty)
                  }
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    width: '150px',
                  }}
                >
                  <option value={QuestionDifficulty.EASY}>Easy</option>
                  <option value={QuestionDifficulty.MEDIUM}>Medium</option>
                  <option value={QuestionDifficulty.HARD}>Hard</option>
                </select>
              </div>

              {/* Question Type Selection */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  Question Type:
                </label>
                <select
                  value={questionType}
                  onChange={(e) =>
                    setQuestionType(e.target.value as QuestionType)
                  }
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    width: '180px',
                  }}
                >
                  <option value={QuestionType.MULTIPLE_CHOICE}>
                    Multiple Choice
                  </option>
                  <option value={QuestionType.TRUE_FALSE}>True/False</option>
                  <option value={QuestionType.FILL_IN_THE_BLANK}>
                    Fill in the Blank
                  </option>
                </select>
              </div>

              {/* Number of Questions Slider */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  Number of Questions: {questionCount}
                </label>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    style={{
                      width: '150px',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      minWidth: '80px',
                    }}
                  >
                    1 - 10
                  </span>
                </div>
              </div>

              {/* Generate Button */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleGenerateQuestions(selectedSubject)}
                  disabled={
                    generatingQuestions ||
                    getFilesBySubject(selectedSubject).length === 0
                  }
                  style={{
                    padding: '10px 20px',
                    backgroundColor:
                      generatingQuestions ||
                      getFilesBySubject(selectedSubject).length === 0
                        ? '#ccc'
                        : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor:
                      generatingQuestions ||
                      getFilesBySubject(selectedSubject).length === 0
                        ? 'not-allowed'
                        : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    height: 'fit-content',
                  }}
                >
                  {generatingQuestions ? 'Generating...' : 'Generate Questions'}
                </button>

                {/* Test Button */}
                <button
                  onClick={() => {
                    console.log('Test button clicked');
                    const testQuestions = [
                      {
                        question:
                          'Test question 1: What is the capital of France?',
                        choices: ['Paris', 'London', 'Berlin', 'Madrid'],
                        answer: 0,
                      },
                      {
                        question:
                          'Test question 2: This is a true/false statement about the subject.',
                        choices: [],
                        answer: null,
                      },
                    ];
                    console.log('Setting test questions:', testQuestions);
                    setGeneratedQuestions(testQuestions);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    height: 'fit-content',
                  }}
                >
                  Test UI
                </button>
              </div>
            </div>

            {/* Validation Message */}
            {getFilesBySubject(selectedSubject).length === 0 && (
              <p
                style={{
                  margin: '0',
                  fontSize: '12px',
                  color: '#dc3545',
                }}
              >
                Upload files to this subject first to generate questions.
              </p>
            )}

            {/* Generated Questions Display */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                }}
              >
                <label
                  style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: '#333',
                  }}
                >
                  Generated Questions ({generatedQuestions.length})
                </label>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Debug: {JSON.stringify(generatedQuestions).substring(0, 100)}
                  ...
                </div>
                {generatedQuestions.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setGeneratedQuestions([])}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowPrintPreview(true)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Print Preview
                    </button>
                  </div>
                )}
              </div>

              {(() => {
                console.log(
                  'Rendering questions section, length:',
                  generatedQuestions.length,
                );
                return null;
              })()}
              {generatedQuestions.length === 0 ? (
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
                    ❓
                  </div>
                  <p style={{ margin: '0', fontSize: '16px' }}>
                    No questions generated yet.
                  </p>
                  <p
                    style={{
                      margin: '10px 0 0 0',
                      fontSize: '14px',
                      color: '#999',
                    }}
                  >
                    Click "Generate Questions" to create questions from your
                    files.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    maxHeight: '600px',
                    overflowY: 'auto',
                  }}
                >
                  {generatedQuestions.map((question, index) => {
                    console.log('Rendering question:', index, question);
                    return (
                      <div
                        key={index}
                        style={{
                          marginBottom: '20px',
                          padding: '15px',
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                        }}
                      >
                        {/* Question Text */}
                        <div
                          style={{
                            fontSize: '16px',
                            color: '#333',
                            marginBottom: '15px',
                            lineHeight: '1.5',
                            fontWeight: '500',
                          }}
                        >
                          {index + 1}. {question.question}
                        </div>

                        {/* Choices */}
                        {question.choices && question.choices.length > 0 && (
                          <div style={{ marginBottom: '15px' }}>
                            {questionType === QuestionType.TRUE_FALSE ? (
                              // Horizontal layout for True/False
                              <div style={{ display: 'flex', gap: '20px' }}>
                                {question.choices.map(
                                  (choice: string, choiceIndex: number) => (
                                    <div
                                      key={choiceIndex}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        backgroundColor: '#f9f9f9',
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: 'bold',
                                          marginRight: '8px',
                                          color: '#007bff',
                                        }}
                                      >
                                        {choice === 'True' ? 'T' : 'F'}.
                                      </span>
                                      <span>{choice}</span>
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : (
                              // Vertical layout for Multiple Choice
                              <div>
                                {question.choices.map(
                                  (choice: string, choiceIndex: number) => (
                                    <div
                                      key={choiceIndex}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        marginBottom: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        backgroundColor: '#f9f9f9',
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: 'bold',
                                          marginRight: '10px',
                                          color: '#007bff',
                                          minWidth: '20px',
                                        }}
                                      >
                                        {String.fromCharCode(65 + choiceIndex)}.
                                      </span>
                                      <span style={{ flex: 1 }}>{choice}</span>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Fill in the blank - no choices shown */}
                        {questionType === QuestionType.FILL_IN_THE_BLANK && (
                          <div style={{ marginTop: '10px' }}>
                            <div
                              style={{
                                borderBottom: '1px solid #333',
                                width: '200px',
                                height: '20px',
                                marginTop: '5px',
                              }}
                            />
                          </div>
                        )}

                        {/* Small answer indicator (hidden when printing) */}
                        {question.answer !== null &&
                          question.answer !== undefined && (
                            <div
                              className="answer-indicator"
                              style={{
                                fontSize: '12px',
                                color: '#666',
                                fontStyle: 'italic',
                                marginTop: '5px',
                              }}
                            >
                              Answer:{' '}
                              {questionType === QuestionType.TRUE_FALSE
                                ? question.answer === 0
                                  ? 'True'
                                  : 'False'
                                : String.fromCharCode(65 + question.answer)}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Print-friendly Exam Section */}
              {generatedQuestions.length > 0 && (
                <div className="exam-print-section" style={{ display: 'none' }}>
                  <div className="exam-header">
                    <h1>Exam</h1>
                    <p>
                      Subject:{' '}
                      {subjects.find((s) => s.subject_id === selectedSubject)
                        ?.name || 'Unknown'}
                    </p>
                    <p>Date: {new Date().toLocaleDateString()}</p>
                  </div>

                  <div className="student-info">
                    <p>
                      <strong>Student Name:</strong>{' '}
                      _________________________________
                    </p>
                    <p>
                      <strong>Student ID:</strong>{' '}
                      _________________________________
                    </p>
                    <p>
                      <strong>Date:</strong> _________________________________
                    </p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <p>
                      <strong>Instructions:</strong>
                    </p>
                    <ul>
                      {questionType === QuestionType.MULTIPLE_CHOICE && (
                        <li>
                          Choose the best answer for each question. Circle the
                          letter (A, B, C, or D) of your choice.
                        </li>
                      )}
                      {questionType === QuestionType.TRUE_FALSE && (
                        <li>
                          Read each statement carefully. Circle T for True or F
                          for False.
                        </li>
                      )}
                      {questionType === QuestionType.FILL_IN_THE_BLANK && (
                        <li>
                          Fill in the blank with the appropriate answer based on
                          the subject content.
                        </li>
                      )}
                    </ul>
                  </div>

                  {generatedQuestions.map((question, index) => (
                    <div key={`print-${index}`} className="question-card">
                      <div className="question-text">
                        {index + 1}. {question.question}
                      </div>

                      {question.choices && question.choices.length > 0 && (
                        <div>
                          {question.choices.map(
                            (choice: string, choiceIndex: number) => (
                              <div key={choiceIndex} className="choice">
                                {questionType === QuestionType.TRUE_FALSE
                                  ? `${choice === 'True' ? 'T' : 'F'}. ${choice}`
                                  : `${String.fromCharCode(65 + choiceIndex)}. ${choice}`}
                              </div>
                            ),
                          )}
                        </div>
                      )}

                      {questionType === QuestionType.FILL_IN_THE_BLANK && (
                        <div style={{ marginTop: '10px' }}>
                          <p>Answer: _________________________________</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && (
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
              width: '80%',
              maxWidth: '800px',
              height: '80%',
              maxHeight: '600px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '15px 20px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px' }}>Print Preview</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Print
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Print Preview Content */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '20px',
                backgroundColor: '#f8f9fa',
              }}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '40px',
                  margin: '0 auto',
                  maxWidth: '600px',
                  minHeight: '100%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {/* Exam Header */}
                <div
                  style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                    borderBottom: '2px solid #000',
                    paddingBottom: '15px',
                  }}
                >
                  <h1
                    style={{
                      margin: '0 0 10px 0',
                      fontSize: '24px',
                      fontWeight: 'bold',
                    }}
                  >
                    Exam
                  </h1>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Subject:</strong>{' '}
                    {subjects.find((s) => s.subject_id === selectedSubject)
                      ?.name || 'Unknown'}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Date:</strong> {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* Student Information */}
                <div
                  style={{
                    marginBottom: '25px',
                    border: '1px solid #000',
                    padding: '15px',
                  }}
                >
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Student Name:</strong>{' '}
                    _________________________________
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Student ID:</strong>{' '}
                    _________________________________
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Date:</strong> _________________________________
                  </p>
                </div>

                {/* Instructions */}
                <div style={{ marginBottom: '25px' }}>
                  <p
                    style={{
                      margin: '0 0 10px 0',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    Instructions:
                  </p>
                  <ul
                    style={{
                      margin: '0',
                      paddingLeft: '20px',
                      fontSize: '14px',
                    }}
                  >
                    {questionType === QuestionType.MULTIPLE_CHOICE && (
                      <li>
                        Choose the best answer for each question. Circle the
                        letter (A, B, C, or D) of your choice.
                      </li>
                    )}
                    {questionType === QuestionType.TRUE_FALSE && (
                      <li>
                        Read each statement carefully. Circle T for True or F
                        for False.
                      </li>
                    )}
                    {questionType === QuestionType.FILL_IN_THE_BLANK && (
                      <li>
                        Fill in the blank with the appropriate answer based on
                        the subject content.
                      </li>
                    )}
                  </ul>
                </div>

                {/* Questions */}
                {generatedQuestions.map((question, index) => (
                  <div
                    key={`preview-${index}`}
                    style={{
                      marginBottom: '20px',
                      padding: '15px',
                      border: '1px solid #000',
                      pageBreakInside: 'avoid',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '14px',
                        marginBottom: '10px',
                        fontWeight: 'bold',
                        lineHeight: '1.4',
                      }}
                    >
                      {index + 1}. {question.question}
                    </div>

                    {question.choices && question.choices.length > 0 && (
                      <div>
                        {questionType === QuestionType.TRUE_FALSE ? (
                          // Horizontal layout for True/False
                          <div style={{ display: 'flex', gap: '20px' }}>
                            {question.choices.map(
                              (choice: string, choiceIndex: number) => (
                                <div
                                  key={choiceIndex}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '5px 10px',
                                    border: '1px solid #000',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 'bold',
                                      marginRight: '8px',
                                    }}
                                  >
                                    {choice === 'True' ? 'T' : 'F'}.
                                  </span>
                                  <span>{choice}</span>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          // Vertical layout for Multiple Choice
                          <div>
                            {question.choices.map(
                              (choice: string, choiceIndex: number) => (
                                <div
                                  key={choiceIndex}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '5px 10px',
                                    marginBottom: '5px',
                                    border: '1px solid #000',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 'bold',
                                      marginRight: '10px',
                                      minWidth: '20px',
                                    }}
                                  >
                                    {String.fromCharCode(65 + choiceIndex)}.
                                  </span>
                                  <span>{choice}</span>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fill in the blank - underline */}
                    {questionType === QuestionType.FILL_IN_THE_BLANK && (
                      <div style={{ marginTop: '10px' }}>
                        <div
                          style={{
                            borderBottom: '1px solid #000',
                            width: '200px',
                            height: '20px',
                            marginTop: '5px',
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
