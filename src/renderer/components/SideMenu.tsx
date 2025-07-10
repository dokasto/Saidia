import React, { useState } from 'react';
import { NavLink, Modal, TextInput, Button, Stack, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCirclePlus, IconBook } from '@tabler/icons-react';

export default function SideMenu() {
  const [subjects, setSubjects] = useState([{ name: 'New Subject' }]);
  const [newSubject, setNewSubject] = useState('');
  const [opened, { open, close }] = useDisclosure(false);

  function handleAddSubject() {
    if (newSubject.trim()) {
      const updatedSubjects = [...subjects];
      updatedSubjects.splice(subjects.length - 1, 0, { name: newSubject });
      setSubjects(updatedSubjects);
      setNewSubject('');
      close();
    }
  }

  function handleClick(subjectName: string) {
    if (subjectName === 'New Subject') {
      open();
    }
  }

  return (
    <>
      <Stack gap="m">
        {subjects.map((subject) => (
          <NavLink
            key={subject.name}
            label={subject.name}
            onClick={() => handleClick(subject.name)}
            styles={{
              root: {
                color: '#000',
                fontWeight: 500,
                borderRadius: '6px',
                padding: '8px 12px',
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              },
            }}
            leftSection={
              subject.name === 'New Subject' ? (
                <IconCirclePlus size={16} stroke={2} color="#000" />
              ) : (
                <IconBook size={16} stroke={1.5} color="#000" />
              )
            }
          />
        ))}
      </Stack>

      <Modal
        opened={opened}
        onClose={close}
        title="Add New Subject"
        centered
        styles={{
          title: {
            color: '#000',
            fontSize: '1.25rem',
            fontWeight: 'bold',
          },
          header: {
            borderBottom: 'none',
          },
          close: {
            color: '#000',
            '&:hover': {
              color: '#333',
            },
          },
          body: {
            paddingTop: '0',
          },
        }}
      >
        <Box
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '1rem',
          }}
        >
          <TextInput
            label="Subject name"
            placeholder="e.g. Physics"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
          />

          <Button
            fullWidth
            mt="md"
            onClick={handleAddSubject}
            styles={{
              root: {
                backgroundColor: '#000',
                color: '#fff',
                fontWeight: 600,
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                '&:hover': {
                  backgroundColor: '#1a1a1a',
                },
              },
            }}
          >
            Add Subject
          </Button>
        </Box>
      </Modal>
    </>
  );
}
