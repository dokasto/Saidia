import React, { useState, useEffect } from 'react';
import * as stylex from '@stylexjs/stylex';
import {
  Container,
  Title,
  Text,
  Button,
  TextInput,
  Select,
  NumberInput,
  Card,
  Group,
  Stack,
  Badge,
  Alert,
  LoadingOverlay,
  Box,
  Divider,
  Paper,
  ActionIcon,
  Modal,
  Flex,
} from '@mantine/core';

import { TSubject, TFile, TQuestion } from '../types';
import { QuestionDifficulty, QuestionType } from '../types/Question';
import {
  SUBJECT_EVENTS,
  FILE_EVENTS,
  QUESTION_EVENTS,
  FILE_SYSTEM_EVENTS,
  LLM_EVENTS,
} from '../constants/events';
import { APP_NAME } from '../constants/misc';

// Define the interface inline to match the backend
interface GenerateQuestionOptions {
  count: number;
  difficulty: QuestionDifficulty;
  type: QuestionType;
}

interface SubjectWithFiles extends TSubject {
  files: TFile[];
  questions: TQuestion[];
}

interface GeneratedQuestion {
  question: string;
  choices?: string[];
  answer?: number;
}

const ExampleDashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectWithFiles[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [questionOptions, setQuestionOptions] =
    useState<GenerateQuestionOptions>({
      difficulty: QuestionDifficulty.MEDIUM,
      type: QuestionType.MULTIPLE_CHOICE,
      count: 5,
    });
  const [generatedQuestions, setGeneratedQuestions] = useState<
    GeneratedQuestion[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: string;
    id: string;
    name: string;
  } | null>(null);

  // Load subjects on component mount
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const response = await window.electron.ipcRenderer.invoke(
        SUBJECT_EVENTS.GET_ALL,
      );
      if (response.success) {
        const subjectsWithData = await Promise.all(
          response.data.map(async (subject: TSubject) => {
            const filesResponse = await window.electron.ipcRenderer.invoke(
              FILE_EVENTS.GET_ALL,
              subject.subject_id,
            );
            const questionsResponse = await window.electron.ipcRenderer.invoke(
              QUESTION_EVENTS.GET_ALL,
              subject.subject_id,
            );

            return {
              ...subject,
              files: filesResponse.success ? filesResponse.data : [],
              questions: questionsResponse.success
                ? questionsResponse.data
                : [],
            };
          }),
        );
        setSubjects(subjectsWithData);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSubject = async () => {
    if (!newSubjectName.trim()) return;

    setLoading(true);
    try {
      const response = await window.electron.ipcRenderer.invoke(
        SUBJECT_EVENTS.CREATE,
        newSubjectName.trim(),
      );
      if (response.success) {
        setNewSubjectName('');
        await loadSubjects();
      } else {
        alert('Failed to create subject: ' + response.error);
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      alert('Error creating subject');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (type: string, id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setLoading(true);
    try {
      let response;
      switch (itemToDelete.type) {
        case 'subject':
          response = await window.electron.ipcRenderer.invoke(
            SUBJECT_EVENTS.DELETE,
            itemToDelete.id,
          );
          break;
        case 'file':
          response = await window.electron.ipcRenderer.invoke(
            FILE_EVENTS.DELETE,
            itemToDelete.id,
          );
          break;
        case 'question':
          response = await window.electron.ipcRenderer.invoke(
            QUESTION_EVENTS.DELETE,
            itemToDelete.id,
          );
          break;
        default:
          return;
      }

      if (response.success) {
        await loadSubjects();
        setDeleteModalOpen(false);
        setItemToDelete(null);
      } else {
        alert('Failed to delete: ' + response.error);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error deleting');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async () => {
    if (!selectedSubject) {
      alert('Please select a subject first');
      return;
    }

    setUploading(true);
    try {
      const dialogResult = await window.electron.dialog.showOpenDialog();
      if (!dialogResult.canceled && dialogResult.filePaths.length > 0) {
        const filePath = dialogResult.filePaths[0];
        const filename = filePath.split('/').pop() || 'unknown';

        // Upload and process the file
        const uploadResponse = await window.electron.ipcRenderer.invoke(
          FILE_SYSTEM_EVENTS.UPLOAD_AND_PROCESS,
          filePath,
          selectedSubject,
        );

        if (uploadResponse.success) {
          // Create file record in database
          const createFileResponse = await window.electron.ipcRenderer.invoke(
            FILE_EVENTS.CREATE,
            selectedSubject,
            filename,
            uploadResponse.data.filepath,
          );

          if (createFileResponse.success) {
            await loadSubjects();
            alert('File uploaded successfully!');
          } else {
            alert('Failed to create file record: ' + createFileResponse.error);
          }
        } else {
          alert('Failed to upload file: ' + uploadResponse.error);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const generateQuestions = async () => {
    if (!selectedSubject) {
      alert('Please select a subject first');
      return;
    }

    setGenerating(true);
    try {
      const response = await window.electron.ipcRenderer.invoke(
        LLM_EVENTS.GENERATE_QUESTIONS,
        selectedSubject,
        questionOptions,
      );

      if (response.success) {
        setGeneratedQuestions(response.data);
        await loadSubjects(); // Reload to get updated questions
      } else {
        alert('Failed to generate questions: ' + response.error);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Error generating questions');
    } finally {
      setGenerating(false);
    }
  };

  const selectedSubjectData = subjects.find(
    (s) => s.subject_id === selectedSubject,
  );

  return (
    <Container size="xl" {...stylex.props(styles.container)}>
      <LoadingOverlay visible={loading} />

      {/* Header */}
      <Paper {...stylex.props(styles.header)}>
        <Title order={1} ta="center" c="white">
          {APP_NAME} Dashboard
        </Title>
        <Text ta="center" c="white" opacity={0.9} size="lg">
          Manage subjects, upload files, and generate questions
        </Text>
      </Paper>

      <Stack gap="xl">
        {/* Create Subject Section */}
        <Paper p="xl" radius="md" withBorder>
          <Title order={2} mb="md">
            Create New Subject
          </Title>
          <Group>
            <TextInput
              placeholder="Enter subject name"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createSubject()}
              style={{ flex: 1 }}
            />
            <Button
              onClick={createSubject}
              disabled={loading || !newSubjectName.trim()}
              loading={loading}
            >
              Create Subject
            </Button>
          </Group>
        </Paper>

        {/* Subjects List */}
        <Paper p="xl" radius="md" withBorder>
          <Title order={2} mb="md">
            Subjects
          </Title>
          {subjects.length === 0 ? (
            <Alert title="No subjects" color="blue" variant="light">
              No subjects created yet. Create your first subject above.
            </Alert>
          ) : (
            <div {...stylex.props(styles.subjectsGrid)}>
              {subjects.map((subject) => (
                <Card
                  key={subject.subject_id}
                  {...stylex.props(
                    selectedSubject === subject.subject_id
                      ? styles.subjectCardSelected
                      : styles.subjectCard,
                  )}
                  onClick={() => setSelectedSubject(subject.subject_id)}
                  withBorder
                  padding="lg"
                  radius="md"
                >
                  <Group justify="space-between" mb="sm">
                    <Title order={3} size="h4">
                      {subject.name}
                    </Title>
                    <ActionIcon
                      variant="filled"
                      color="red"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(
                          'subject',
                          subject.subject_id,
                          subject.name,
                        );
                      }}
                    >
                      ×
                    </ActionIcon>
                  </Group>
                  <Group gap="xs">
                    <Badge variant="light">{subject.files.length} files</Badge>
                    <Badge variant="light">
                      {subject.questions.length} questions
                    </Badge>
                  </Group>
                </Card>
              ))}
            </div>
          )}
        </Paper>

        {/* Selected Subject Details */}
        {selectedSubjectData && (
          <Paper p="xl" radius="md" withBorder>
            <Title order={2} mb="xl">
              {selectedSubjectData.name} - Details
            </Title>

            <Stack gap="xl">
              {/* File Upload */}
              <Box>
                <Title order={3} mb="md">
                  Upload Files
                </Title>
                <Button onClick={uploadFile} loading={uploading} color="green">
                  Upload File
                </Button>
              </Box>

              {/* Files List */}
              <Box>
                <Title order={3} mb="md">
                  Files ({selectedSubjectData.files.length})
                </Title>
                {selectedSubjectData.files.length === 0 ? (
                  <Alert title="No files" color="blue" variant="light">
                    No files uploaded yet.
                  </Alert>
                ) : (
                  <Stack gap="xs">
                    {selectedSubjectData.files.map((file) => (
                      <Paper key={file.file_id} p="md" withBorder>
                        <Group justify="space-between">
                          <Group gap="xs">
                            <Text fw={500}>{file.filename}</Text>
                          </Group>
                          <ActionIcon
                            variant="filled"
                            color="red"
                            size="sm"
                            onClick={() =>
                              confirmDelete('file', file.file_id, file.filename)
                            }
                          >
                            ×
                          </ActionIcon>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>

              {/* Question Generation */}
              <Box>
                <Title order={3} mb="md">
                  Generate Questions
                </Title>
                <Stack gap="md">
                  <Group>
                    <Select
                      label="Difficulty"
                      value={questionOptions.difficulty}
                      onChange={(value) =>
                        setQuestionOptions({
                          ...questionOptions,
                          difficulty: value as QuestionDifficulty,
                        })
                      }
                      data={[
                        { value: QuestionDifficulty.EASY, label: 'Easy' },
                        { value: QuestionDifficulty.MEDIUM, label: 'Medium' },
                        { value: QuestionDifficulty.HARD, label: 'Hard' },
                      ]}
                      style={{ flex: 1 }}
                    />

                    <Select
                      label="Type"
                      value={questionOptions.type}
                      onChange={(value) =>
                        setQuestionOptions({
                          ...questionOptions,
                          type: value as QuestionType,
                        })
                      }
                      data={[
                        {
                          value: QuestionType.MULTIPLE_CHOICE,
                          label: 'Multiple Choice',
                        },
                        { value: QuestionType.TRUE_FALSE, label: 'True/False' },
                        {
                          value: QuestionType.FILL_IN_THE_BLANK,
                          label: 'Fill in the Blank',
                        },
                      ]}
                      style={{ flex: 1 }}
                    />

                    <NumberInput
                      label="Count"
                      value={questionOptions.count}
                      onChange={(value) =>
                        setQuestionOptions({
                          ...questionOptions,
                          count: typeof value === 'number' ? value : 5,
                        })
                      }
                      min={1}
                      max={20}
                      style={{ flex: 1 }}
                    />
                  </Group>

                  <Button
                    onClick={generateQuestions}
                    loading={generating}
                    disabled={selectedSubjectData.files.length === 0}
                    color="orange"
                  >
                    Generate Questions
                  </Button>

                  {selectedSubjectData.files.length === 0 && (
                    <Alert title="No files" color="red" variant="light">
                      Upload at least one file before generating questions.
                    </Alert>
                  )}
                </Stack>
              </Box>

              {/* Questions List */}
              <Box>
                <Title order={3} mb="md">
                  Questions ({selectedSubjectData.questions.length})
                </Title>
                {selectedSubjectData.questions.length === 0 ? (
                  <Alert title="No questions" color="blue" variant="light">
                    No questions generated yet.
                  </Alert>
                ) : (
                  <Stack gap="md">
                    {selectedSubjectData.questions.map((question) => (
                      <Paper key={question.question_id} p="md" withBorder>
                        <Stack gap="sm">
                          <Group justify="space-between">
                            <Group gap="xs">
                              <Badge variant="filled">{question.type}</Badge>
                              <Badge variant="light" color="green">
                                {question.difficulty}
                              </Badge>
                            </Group>
                            <ActionIcon
                              variant="filled"
                              color="red"
                              size="sm"
                              onClick={() =>
                                confirmDelete(
                                  'question',
                                  question.question_id,
                                  question.title,
                                )
                              }
                            >
                              ×
                            </ActionIcon>
                          </Group>

                          <Text fw={600}>{question.title}</Text>

                          {question.options && question.options.length > 0 && (
                            <Stack gap="xs">
                              {question.options.map((option, index) => (
                                <Text key={index} size="sm">
                                  {String.fromCharCode(65 + index)}. {option}
                                </Text>
                              ))}
                            </Stack>
                          )}

                          {typeof question.answer === 'number' && (
                            <Alert title="Answer" color="green" variant="light">
                              {String.fromCharCode(65 + question.answer)}
                            </Alert>
                          )}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Generated Questions Preview */}
        {generatedQuestions.length > 0 && (
          <Paper p="xl" radius="md" withBorder>
            <Title order={2} mb="md">
              Recently Generated Questions
            </Title>
            <Stack gap="md">
              {generatedQuestions.map((question, index) => (
                <Paper
                  key={index}
                  p="md"
                  withBorder
                  {...stylex.props(styles.generatedQuestion)}
                >
                  <Title order={4} mb="sm">
                    Question {index + 1}
                  </Title>
                  <Text mb="md">{question.question}</Text>

                  {question.choices && (
                    <Stack gap="xs" mb="md">
                      {question.choices.map(
                        (choice: string, choiceIndex: number) => (
                          <Text key={choiceIndex} size="sm">
                            {String.fromCharCode(65 + choiceIndex)}. {choice}
                          </Text>
                        ),
                      )}
                    </Stack>
                  )}

                  {typeof question.answer === 'number' && (
                    <Alert title="Answer" color="green" variant="light">
                      {String.fromCharCode(65 + question.answer)}
                    </Alert>
                  )}
                </Paper>
              ))}
            </Stack>
          </Paper>
        )}
      </Stack>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Delete"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete this {itemToDelete?.type}?
            {itemToDelete?.type === 'subject' &&
              ' This will also delete all associated files and questions.'}
          </Text>
          <Text fw={600}>{itemToDelete?.name}</Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDelete} loading={loading}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

const styles = stylex.create({
  container: {
    padding: '20px',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '30px',
    marginBottom: '30px',
    borderRadius: '12px',
    textAlign: 'center',
  },
  subjectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  subjectCard: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    // StyleX does not support pseudo-classes at the top level, so remove this for now
  },
  subjectCardSelected: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderColor: '#667eea',
    backgroundColor: '#f7fafc',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
  },
  generatedQuestion: {
    backgroundColor: '#f0fff4',
    borderColor: '#c6f6d5',
  },
});

export default ExampleDashboard;
