import {
  Stack,
  Button,
  Group,
  Badge,
  ScrollArea,
  ActionIcon,
} from '@mantine/core';
import { IconUpload, IconX } from '@tabler/icons-react';
import React, { useCallback, useEffect, useRef } from 'react';
import { TSubject } from '../../types';
import useFiles from '../hooks/useFiles';

type Props = {
  subject: TSubject;
};

export default function File({ subject }: Props) {
  const { add, getAll, files, deleteFile } = useFiles(subject.subject_id);
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

  const handleDelete = useCallback(
    async (filePath: string) => {
      console.log('Attempting to delete:', filePath);

      const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
      console.log(fileName);

      const result = await deleteFile(fileName);
      if (result) {
        getAll();
      } else {
        alert('Failed to delete file.');
      }
    },
    [deleteFile, getAll],
  );

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
        {files.length > 0 && (
          <ScrollArea
            style={{ width: '100%', height: 'auto', maxHeight: 100 }}
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
                    rightSection={
                      <ActionIcon
                        size="xs"
                        color="gray"
                        variant="transparent"
                        onClick={() => handleDelete(fileName)}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    }
                  >
                    📄 {fileName}
                  </Badge>
                );
              })}
            </Group>
          </ScrollArea>
        )}
      </Stack>
    </div>
  );
}
