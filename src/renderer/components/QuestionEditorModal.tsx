import React from 'react';
import { Modal, Textarea, Text, Stack, Title, ScrollArea } from '@mantine/core';
import { TGeneratedQuestion } from '../../types';

type Props = {
  opened: boolean;
  onClose: () => void;
  questions: TGeneratedQuestion[];
  questionType: string | null;
};

export default function QuestionEditorModal({
  opened,
  onClose,
  questions,
  questionType,
}: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Generated Questions"
      size="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack spacing="lg">
        {questions.map((q, index) => (
          <Stack key={index} spacing="xs">
            <Title order={5}>Question {index + 1}</Title>

            <Textarea value={q.question} autosize minRows={2} />

            {questionType === 'multiple_choice' && q.choices && (
              <Stack spacing="xs">
                {q.choices.map((choice, i) => (
                  <Text key={i}>
                    <b>{String.fromCharCode(65 + i)}.</b> {choice}
                  </Text>
                ))}
              </Stack>
            )}
          </Stack>
        ))}
      </Stack>
    </Modal>
  );
}
