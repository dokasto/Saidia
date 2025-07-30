import React, { useState, useEffect } from 'react';
import {
  Modal,
  Textarea,
  Button,
  Stack,
  TextInput,
  Loader,
} from '@mantine/core';
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
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  useEffect(() => {
    if (question) {
      setTitle(question.title);
      setOptions(question.options ?? []);
    }
  }, [question]);

  const updateOption = (index: number, newValue: string) => {
    const updated = [...options];
    updated[index] = newValue;
    setOptions(updated);
  };

  const handleSave = async () => {
    if (!question) return;
    setLoading(true);

    const updatedData: any = { title };
    if (options.length > 0) updatedData.options = options;

    const response = await window.electron.ipcRenderer.invoke(
      QUESTION_EVENTS.UPDATE,
      question.question_id,
      updatedData,
    );

    if (response.success) {
      await onSaved();
      onClose();
      notifications.show({
        title: 'Question Updated',
        message: 'Question has been updated!',
        color: 'black',
        style: { backgroundColor: 'rgba(144, 238, 144, 0.2)' },
      });
    } else {
      notifications.show({
        title: 'Update failed',
        message: `${response.error}`,
        color: 'black',
        style: { backgroundColor: 'rgba(251, 76, 76, 0.25)' },
      });
    }
    setLoading(false);
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

        {options.length > 0 && (
          <Stack>
            {options.map((opt, index) => (
              <TextInput
                key={index}
                label={`Choice ${index + 1}`}
                value={opt}
                onChange={(e) => updateOption(index, e.target.value)}
              />
            ))}
          </Stack>
        )}
        <Button
          onClick={handleSave}
          style={{ backgroundColor: 'black', color: 'white' }}
          disabled={loading}
        >
          {loading ? <Loader color="white" size="xs" /> : 'Save Changes'}
        </Button>
      </Stack>
    </Modal>
  );
}
