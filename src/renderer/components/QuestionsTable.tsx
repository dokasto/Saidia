import React from 'react';
// import { Table } from '@mantine/core';

export default function QuestionsTableUI() {
  const tableRow = [
    {
      question: 'What is a Binary Tree?',
      difficulty: 'Easy',
      edit: 'Edit',
      delete: 'Delete',
    },

    {
      question: 'What is a Binary Tree?',
      difficulty: 'Hard',
      edit: 'Edit',
      delete: 'Delete',
    },
    {
      question: 'What is a Binary Tree?',
      difficulty: 'Medium',
      edit: 'Edit',
      delete: 'Delete',
    },
    {
      question: 'What fomular for finding the length of a rectangle',
      difficulty: 'Easy',
      edit: 'Edit',
      delete: 'Delete',
    },

    {
      question: 'What fomular for finding the length of a rectangle',
      difficulty: 'Easy',
      edit: 'Edit',
      delete: 'Delete',
    },
  ];

  const rows = tableRow.map((element) => (
    <Table.Tr key={element.question}>
      <Table.Td>{element.question}</Table.Td>
      <Table.Td>{element.difficulty}</Table.Td>
      <Table.Td>{element.edit}</Table.Td>
      <Table.Td>{element.delete}</Table.Td>
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
