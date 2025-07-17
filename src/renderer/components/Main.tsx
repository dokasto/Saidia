import React, { useContext } from 'react';
import { Stack } from '@mantine/core';
import { SubjectContext } from '../providers/subjectProvider';
import File from './File';
import Question from './Question';

export default function Main() {
  const { selected } = useContext(SubjectContext);
  return selected == null ? (
    <div>No active selected subject</div>
  ) : (
    <Stack>
      <File subject={selected} />
      <Question subject={selected} />
    </Stack>
  );
}
