// components/PrintModal.tsx
import React from 'react';
import { Button, Modal, Stack, Text, Title } from '@mantine/core';
import { TQuestion } from '../../types';

type Props = {
  opened: boolean;
  onClose: () => void;
  questions: TQuestion[];
};

export default function PrintModal({ opened, onClose, questions }: Props) {
  const handlePrint = () => {
    onClose();
    alert('Question Printed!');
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Print Selected Questions"
      size="lg"
    >
      <Stack spacing="md">
        {questions.map((q, index) => (
          <div key={q.question_id}>
            <Title order={5}>
              {index + 1}. {q.title}
            </Title>
            <Stack pl="md" mt="xs">
              {q.options?.map((opt, i) => (
                <Text key={i}>
                  {String.fromCharCode(65 + i)}. {opt}
                </Text>
              )) || (
                <Text italic color="dimmed">
                  No options available
                </Text>
              )}
            </Stack>
          </div>
        ))}

        <Button mt="lg" color="black" onClick={handlePrint}>
          Print
        </Button>
      </Stack>
    </Modal>
  );
}
