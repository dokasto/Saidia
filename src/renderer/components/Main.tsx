import React, { useContext, useEffect } from 'react';
import { SubjectContext } from '../providers/subjectProvider';
import { Button, Stack, Text, Badge, Group } from '@mantine/core';
import useFiles from '../hooks/fileHooks';
import { IconUpload } from '@tabler/icons-react';

export default function Main() {
  const { selected } = useContext(SubjectContext);
  const subjectId: string | null = selected?.subject_id ?? null;
  const { addFiles, listFiles, files, filesBySubject } = useFiles(subjectId);

  useEffect(() => {
    if (selected) {
      listFiles(selected?.subject_id);
    }
  }, [selected]);

  const handleUpload = () => {
    if (subjectId) {
      addFiles(subjectId);
    }
  };

  return (
    <div>
      {selected && (
        <Stack gap="sm" align="start">
          <h1 style={{ margin: 0 }}>{selected.name}</h1>

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
          {files.length > 0 ? (
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
          ) : (
            <Text size="sm" color="dimmed">
              No files uploaded yet.
            </Text>
          )}
        </Stack>
      )}
    </div>
  );
}
