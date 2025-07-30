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
  const { questions, getQuestions } = useGetQuestions(subject.subject_id);
  const [selectedQuestions, setSelectedQuestions] = useState<
    TGeneratedQuestion[]
  >([]);

  return (
    <Stack>
      <GenerateQuestion subject={subject} onSaved={getQuestions} />
      <h2 style={{ margin: 0 }}>Question List</h2>

      <QuestionsTable questions={questions ?? []} onSaved={getQuestions} />
    </Stack>
  );
}
