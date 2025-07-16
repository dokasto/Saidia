import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  NavLink,
  Modal,
  TextInput,
  Button,
  Stack,
  Box,
  Menu,
  ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCirclePlus,
  IconBook,
  IconDots,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { SUBJECT_EVENTS } from '../../constants/events';
import { Subject } from '../../main/database/models';
import { SubjectContext } from '../providers/subjectProvider';

export default function SideMenu() {
  const { create, changeName, remove, selected, subjects, getAll, select } =
    useContext(SubjectContext);
  const [opened, { open, close }] = useDisclosure(false);
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState<string>('');

  const [editOpened, { open: openEdit, close: closeEdit }] =
    useDisclosure(false);
  const [editSubjectId, setEditSubjectId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');

  const handleAddSubject = useCallback(async () => {
    if (newSubject == null || newSubject.trim().length < 0) return;
    const success = await create(newSubject.trim());
    if (success) {
      setNewSubject('');
      close();
      await getAll();
    }
  }, [newSubject, getAll]);

  const handleSaveEditedSubject = useCallback(async () => {
    if (editSubjectId && editedName.trim()) {
      const success = await changeName(editSubjectId, editedName);

      if (success) {
        await getAll();
      }
      closeEdit();
    }
  }, [editSubjectId, editedName, getAll]);

  const handleDelete = useCallback(
    async (subjectId: string) => {
      const success = await remove(subjectId);
      if (success) {
        alert('success!');
        await getAll();
      }
    },
    [remove, getAll],
  );

  const handleSelected = useCallback(
    (subjectId: string) => {
      select(subjectId);
    },
    [select],
  );

  return (
    <>
      <Stack gap="sm">
        {subjects.map((subject) => (
          <Box
            key={subject.subject_id}
            onMouseEnter={() => setHoveredSubject(subject.name)}
            onMouseLeave={() => setHoveredSubject(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor:
                subject.name === hoveredSubject ? '#f5f5f5' : 'transparent',
              transition: 'background-color 0.2s ease',
              cursor: 'pointer',
            }}
          >
            <Box style={{ flex: 1 }}>
              <NavLink
                label={subject.name}
                active={subject.subject_id === selected?.subject_id}
                onClick={() => handleSelected(subject.subject_id)}
                styles={{
                  root: {
                    color: '#000',
                    fontWeight: 500,
                    padding: 0,
                    background: 'transparent',
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
            </Box>

            <Menu shadow="md" width={120} position="bottom-end" withArrow>
              <Menu.Target>
                <ActionIcon
                  variant="transparent"
                  size="sm"
                  style={{
                    visibility:
                      subject.name !== 'New Subject' &&
                      hoveredSubject === subject.name
                        ? 'visible'
                        : 'hidden',
                  }}
                >
                  <IconDots size={16} color="#000" />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={() => {
                    setEditSubjectId(subject.subject_id);
                    setEditedName(subject.name);
                    openEdit();
                  }}
                >
                  Edit
                </Menu.Item>
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => {
                    handleDelete(subject.subject_id);
                  }}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Box>
        ))}

        <Button
          onClick={open}
          variant="light"
          fullWidth
          leftSection={<IconCirclePlus size={16} />}
          styles={{
            root: {
              justifyContent: 'flex-start',
              padding: '6px 10px',
              fontWeight: 500,
              color: '#000',
              backgroundColor: '#f9f9f9',
              borderRadius: '6px',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
            },
          }}
        >
          Add New Subject
        </Button>
      </Stack>
      {/* Add Subject Modal */}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddSubject();
              }
            }}
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

      {/* Edit Subject Modal */}
      <Modal
        opened={editOpened}
        onClose={closeEdit}
        title="Edit Subject"
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
            label="Edit subject name"
            placeholder="e.g. Physics"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveEditedSubject();
              }
            }}
          />

          <Button
            fullWidth
            mt="md"
            onClick={handleSaveEditedSubject}
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
            Save Changes
          </Button>
        </Box>
      </Modal>
    </>
  );
}
