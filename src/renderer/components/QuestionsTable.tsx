import React, { useEffect, useState } from 'react';
import { Button, Checkbox, Stack, Table } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { TQuestion } from '../../types';
import { QUESTION_EVENTS } from '../../constants/events';
import SingleQuestionEditModal from './SingleQuestionEditModal';
import PrintModal from './PrintModal';

type Props = {
  questions: TQuestion[];
  onSaved: () => Promise<void>;
};

export default function QuestionsTableUI({ questions, onSaved }: Props) {
  const [questionBeingEdited, setQuestionBeingEdited] =
    useState<TQuestion | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]); // to hold selected questions

  const toggleSelect = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedQuestionIds.length === questions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(questions.map((q) => q.question_id));
    }
  };

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

  useEffect(() => {
    setSelectedQuestionIds([]);
  }, [questions]);

  console.log('questions', questions);

  const rows = questions.map((q) => (
    <Table.Tr key={q.question_id}>
      <Table.Td>
        <Checkbox
          checked={selectedQuestionIds.includes(q.question_id)}
          onChange={() => toggleSelect(q.question_id)}
        />
      </Table.Td>
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
      <Table.ScrollContainer minWidth={500} maxHeight={700}>
        <Table
          striped
          highlightOnHover
          horizontalSpacing="xl"
          verticalSpacing="md"
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Checkbox
                  color="gray"
                  checked={
                    selectedQuestionIds.length === questions.length &&
                    questions.length > 0
                  }
                  indeterminate={
                    selectedQuestionIds.length > 0 &&
                    selectedQuestionIds.length < questions.length
                  }
                  onChange={toggleSelectAll}
                />
              </Table.Th>
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

      {selectedQuestionIds.length > 0 && (
        <Button color="gray" onClick={() => setPrintModalOpen(true)}>
          Print Selected Question ({selectedQuestionIds.length})
        </Button>
      )}

      <PrintModal
        opened={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        questions={questions.filter((q) =>
          selectedQuestionIds.includes(q.question_id),
        )}
      />
    </Stack>
  );
}
