import React, { useState } from 'react';
import { Button, Stack, Table } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { TQuestion } from '../../types';
import { QUESTION_EVENTS } from '../../constants/events';
import SingleQuestionEditModal from './SingleQuestionEditModal';

type Props = {
  questions: TQuestion[];
  onSaved: () => Promise<void>;
};

export default function QuestionsTableUI({ questions, onSaved }: Props) {
  const [questionBeingEdited, setQuestionBeingEdited] =
    useState<TQuestion | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleDelete = async (questionId: string) => {
    const response = await window.electron.ipcRenderer.invoke(
      QUESTION_EVENTS.DELETE,
      questionId,
    );

    if (response.success) {
      await onSaved();
      notifications.show({
        title: 'Question Deleted',
        message: 'Question has been deleted!',
        color: 'black',
        style: { backgroundColor: 'rgba(144, 238, 144, 0.2)' },
      });
    } else {
      notifications.show({
        title: 'Failed to delete',
        message: 'Question failed to delete',
        color: 'black',
        style: { backgroundColor: 'rgba(251, 76, 76, 0.25)' },
      });
    }
  };

  const rows = questions.map((q) => (
    <Table.Tr key={q.question_id}>
      <Table.Td>{q.title}</Table.Td>
      <Table.Td>{q.difficulty}</Table.Td>
      <Table.Td>
        <Button
          variant="transparent"
          size="xs"
          onClick={() => {
            setQuestionBeingEdited(q);
            setEditModalOpen(true);
          }}
        >
          Edit
        </Button>
      </Table.Td>
      <Table.Td>
        <Button
          variant="transparent"
          color="red"
          size="xs"
          onClick={() => handleDelete(q.question_id)}
        >
          Delete
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack>
      <Table.ScrollContainer minWidth={500} maxHeight={300}>
        <Table
          striped
          highlightOnHover
          horizontalSpacing="xl"
          verticalSpacing="md"
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Question</Table.Th>
              <Table.Th>Difficulty</Table.Th>
              <Table.Th>Edit</Table.Th>
              <Table.Th>Delete</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <SingleQuestionEditModal
        opened={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setQuestionBeingEdited(null);
        }}
        question={questionBeingEdited}
        onSaved={onSaved}
      />
    </Stack>
  );
}
