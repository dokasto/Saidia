import React, { useContext, useEffect } from 'react';
import { SubjectContext } from '../providers/subjectProvider';
import { Button, Stack, Text, Badge, Group } from '@mantine/core';
import useFiles from '../hooks/useFiles';
import { IconUpload } from '@tabler/icons-react';
import File from './File';
import Question from './Question';

export default function Main() {
  const { selected } = useContext(SubjectContext);
  return selected == null ? (
    <div>Subject empty</div>
  ) : (
    <>
      <File subject={selected} />
      <Question subject={selected} />
    </>
  );
}
