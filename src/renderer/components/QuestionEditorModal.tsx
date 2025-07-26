import React, { useEffect, useState } from 'react';
import {
  Modal,
  Textarea,
  Text,
  Stack,
  Title,
  ScrollArea,
  Group,
  Button,
} from '@mantine/core';
import { TGeneratedQuestion, TSubject } from '../../types';
import { notifications } from '@mantine/notifications';

type Props = {
  opened: boolean;
  onClose: () => void;
  questions: TGeneratedQuestion[];
  questionType: string | null;
  subject: TSubject;
};

export default function QuestionEditorModal({
  opened,
  onClose,
  questions,
  questionType,
  subject,
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
    if (updated[questionIndex].choices) {
      updated[questionIndex].choices[choiceIndex] = value;
    }
    SeteditableQuestions(updated);
  }

  function handleSave() {
    notifications.show({
      title: 'Question Saved',
      message: 'Question has been saved!',
      color: 'black',
      style: { backgroundColor: 'rgba(144, 238, 144, 0.2)' },
    });
    console.log('Saving edited questions:', editableQuestions);
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={subject.name}
      size="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack spacing="lg">
        {questions.map((q, index) => (
          <Stack key={index} spacing="xs">
            <Title order={5}>Question {index + 1}</Title>
            <Textarea
              value={q.question}
              autosize
              onChange={(e) => {
                handleQuestionTextEdit(index, e.target.value);
              }}
            />
            {questionType === 'multiple_choice' && q.choices && (
              <Stack spacing="xs">
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
