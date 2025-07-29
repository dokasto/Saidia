import React, { useState, useEffect } from 'react';
import { Modal, Textarea, Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { QUESTION_EVENTS } from '../../constants/events';
import { TQuestion } from '../../types';

type Props = {
  opened: boolean;
  onClose: () => void;
  question: TQuestion | null;
  onSaved: () => Promise<void>;
};

export default function SingleQuestionEditModal({
  opened,
  onClose,
  question,
  onSaved,
}: Props) {
  const [title, setTitle] = useState('');
  useEffect(() => {
    if (question) {
      setTitle(question.title);
    }
  }, [question]);

  const handleSave = async () => {
    if (!question) return;

    const response = await window.electron.ipcRenderer.invoke(
      QUESTION_EVENTS.UPDATE,
      question.question_id,
      { title },
    );

    if (response.success) {
      await onSaved();
      onClose();
    } else {
      notifications.show({
        title: 'Update failed',
        message: `${response.error}`,
        color: 'black',
        style: { backgroundColor: 'rgba(251, 76, 76, 0.25)' },
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit This Question"
      size="md"
      centered
    >
      <Stack>
        <Textarea
          label="Question"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          minRows={3}
        />
        <Button onClick={handleSave}>Save Changes</Button>
      </Stack>
    </Modal>
  );
}
