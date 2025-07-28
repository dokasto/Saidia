import React, { useEffect, useState } from 'react';
import {
  Modal,
  Textarea,
  Stack,
  Title,
  ScrollArea,
  Group,
  Button,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { TGeneratedQuestion, TQuestionDifficulty, TSubject } from '../../types';
import { QUESTION_EVENTS } from '../../constants/events';

type Props = {
  opened: boolean;
  onClose: () => void;
  questions: TGeneratedQuestion[];
  questionType: string | null;
  subject: TSubject;
  selectedType: string | null;
  onSaved: () => Promise<void>;
  selectedDifficulty: TQuestionDifficulty | null;
};

export default function QuestionEditorModal({
  opened,
  onClose,
  questions,
  questionType,
  selectedType,
  selectedDifficulty,
  subject,
  onSaved,
}: Props) {
  const [editableQuestions, SeteditableQuestions] =
    useState<TGeneratedQuestion[]>(questions);

  useEffect(() => {
    SeteditableQuestions(questions);
  }, [questions]);

  function handleQuestionTextEdit(index: number, value: string) {
    const updated = [...editableQuestions];
    updated[index].question = value;
    SeteditableQuestions(updated);
  }

  function handleChoiceEdit(
    questionIndex: number,
    choiceIndex: number,
    value: string,
  ) {
    const updated = [...editableQuestions];
    if (updated[questionIndex]?.choices[choiceIndex] != null) {
      updated[questionIndex].choices[choiceIndex] = value;
    }
    SeteditableQuestions(updated);
  }

  async function handleSave() {
    const response = await window.electron.ipcRenderer.invoke(
      QUESTION_EVENTS.SAVE_QUESTIONS,
      subject.subject_id,
      editableQuestions,
      selectedDifficulty,
      selectedType,
    );

    console.log('saved Questions :', response);
    if (response.success) {
      notifications.show({
        title: 'Question Saved',
        message: 'Question has been saved!',
        color: 'black',
        style: { backgroundColor: 'rgba(144, 238, 144, 0.2)' },
      });
    } else {
      notifications.show({
        title: 'Failed to save',
        message: 'Failed to save questions',
        color: 'black',
        style: { backgroundColor: 'rgba(251, 76, 76, 0.25)' },
      });
    }
    onClose();
    onSaved();
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={subject.name}
      size="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="lg">
        {editableQuestions.map((q, index) => (
          <Stack key={index} gap="xs">
            <Title order={5}>Question {index + 1}</Title>
            <Textarea
              value={q.question}
              autosize
              onChange={(e) => {
                handleQuestionTextEdit(index, e.target.value);
              }}
            />
            {questionType === 'multiple_choice' && q.choices && (
              <Stack gap="xs">
                {q.choices.map((choice, i) => (
                  <Textarea
                    key={i}
                    autosize
                    value={choice}
                    onChange={(e) => handleChoiceEdit(index, i, e.target.value)}
                    label={`Option ${String.fromCharCode(65 + i)}`}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        ))}

        <Group justify="flex-end" mt="md">
          <Button onClick={handleSave} color="rgba(28, 28, 28, 1)">
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
