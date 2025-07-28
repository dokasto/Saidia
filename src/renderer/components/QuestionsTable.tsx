import React from 'react';
import { Button, Table } from '@mantine/core';
import { TQuestion } from '../../types';

type Props = {
  questions: TQuestion[];
};

export default function QuestionsTableUI({ questions }: Props) {
  const rows = questions.map((q) => (
    <Table.Tr key={q.question_id}>
      <Table.Td>{q.title}</Table.Td>
      <Table.Td>{q.difficulty}</Table.Td>
      <Table.Td>
        <Button variant="transparent" size="xs">
          Edit
        </Button>
      </Table.Td>
      <Table.Td>
        <Button variant="transparent" color="red" size="xs">
          Delete
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
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
  );
}
