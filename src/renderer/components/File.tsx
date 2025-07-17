import { Stack, Button, Group, Badge, ScrollArea } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import React, { useCallback, useEffect, useRef } from 'react';
import { TSubject } from '../../types';
import useFiles from '../hooks/useFiles';

type Props = {
  subject: TSubject;
};

export default function File({ subject }: Props) {
  const { add, getAll, files } = useFiles(subject.subject_id);
  const hasListedFiles = useRef(false);

  useEffect(() => {
    if (hasListedFiles.current) {
      return;
    }
    hasListedFiles.current = true;
    getAll();
  }, [getAll]);

  const handleUpload = useCallback(async () => {
    const result = await add();
    if (result) {
      getAll();
    } else {
      alert('Error!');
    }
  }, [getAll, add]);

  return (
    <div>
      <Stack gap="sm" align="start">
        <h1 style={{ margin: 0 }}>{subject.name}</h1>

        <Button
          variant="outline"
          leftSection={<IconUpload size={18} />}
          onClick={handleUpload}
          styles={{
            root: {
              borderStyle: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'black',
              backgroundColor: 'white',
              padding: '0',
            },
          }}
        >
          Upload files for this subject
        </Button>

        <ScrollArea
          style={{ width: '100%', height: 20 }}
          type="auto"
          scrollbarSize={6}
        >
          <Group gap="sm" wrap="wrap">
            {files.map((filePath, index) => {
              const fileName = filePath.split(/[/\\]/).pop();
              return (
                <Badge
                  key={index}
                  color="gray"
                  variant="light"
                  radius="xl"
                  size="lg"
                >
                  📄 {fileName}
                </Badge>
              );
            })}
          </Group>
        </ScrollArea>
      </Stack>
    </div>
  );
}
