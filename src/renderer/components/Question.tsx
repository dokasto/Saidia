import React, { useState } from 'react';
import { Group, TextInput, Stack } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { TSubject } from '../../types';
import QuestionsTable from './QuestionsTable';
import GenerateQuestion from './GenerateQuestion';
import useGetQuestions from '../hooks/useGetQuestions';

type Props = {
  subject: TSubject;
};

export default function Question({ subject }: Props) {
  const [query, setQuery] = useState('');
  const { questions, getQuestions } = useGetQuestions(subject.subject_id);

  return (
    <Stack>
      <GenerateQuestion subject={subject} onSaved={getQuestions} />
      <h2 style={{ margin: 0 }}>Question List</h2>
      <Group gap="xs" align="center">
        <TextInput
          placeholder="Search…"
          leftSection={
            <IconSearch size={16} style={{ pointerEvents: 'none' }} />
          }
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ width: '100%' }}
          size="sm"
          radius="md"
          styles={{
            input: {
              backgroundColor: '#f0f0f0',
              border: 'none',
            },
          }}
        />
      </Group>
      <QuestionsTable questions={questions ?? []} onSaved={getQuestions} />
    </Stack>
  );
}
