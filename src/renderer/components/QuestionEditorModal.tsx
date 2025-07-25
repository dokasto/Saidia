import React, { useState } from 'react';
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
import { IconEdit } from '@tabler/icons-react';
import { TGeneratedQuestion, TSubject } from '../../types';

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
  const [isEdiing, setIsEditing] = useState(false);

  const handleEditClick = () => {
    setIsEditing(true);
  };

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
            <Group align="center" className="hover-group">
              <Title order={5}>Question {index + 1}</Title>
              <IconEdit
                size={18}
                className="edit-icon"
                color="gray"
                onClick={() => setIsEditing(true)}
              />
            </Group>
            {isEdiing ? (
              <Textarea value={q.question} autosize minRows={2} />
            ) : (
              <Text className="mb-2">{q.question}</Text>
            )}

            {questionType === 'multiple_choice' && q.choices && (
              <Stack spacing="xs">
                {q.choices.map((choice, i) => (
                  <Group key={i} align="center" className="hover-group">
                    <Text>
                      <b>{String.fromCharCode(65 + i)}.</b> {choice}
                    </Text>
                    <IconEdit size={16} className="edit-icon" color="gray" />
                  </Group>
                ))}
              </Stack>
            )}
          </Stack>
        ))}

        <Group justify="flex-end" mt="md">
          <Button onClick={onClose} color="rgba(28, 28, 28, 1)">
            Done
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
