import React, { useState } from 'react';
import { Group, TextInput, Menu, Button, Stack } from '@mantine/core';
import { IconSearch, IconChevronDown } from '@tabler/icons-react';
import { TSubject } from '../../types';
import QuestionsTable from './QuestionsTable';

type Props = {
  subject: TSubject;
};

export default function Question({ subject }: Props) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  return (
    <Stack>
      <h2>Question List</h2>
      <Group gap="xs" align="center">
        <TextInput
          placeholder="Search…"
          leftSection={
            <IconSearch size={16} style={{ pointerEvents: 'none' }} />
          }
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ width: '85%' }}
          size="sm"
          radius="md"
          styles={{
            input: {
              backgroundColor: '#f0f0f0',
              border: 'none',
            },
          }}
        />
        <Menu shadow="md" width={160} position="bottom-start">
          <Menu.Target>
            <Button
              variant="light"
              color="gray"
              radius="xl"
              size="xs"
              rightSection={<IconChevronDown size={12} />}
              styles={{ root: { padding: '4px 12px' } }}
            >
              Sort
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Sort by</Menu.Label>
            <Menu.Item onClick={() => console.log('Sort: Name')}>
              Name
            </Menu.Item>
            <Menu.Item onClick={() => console.log('Sort: Date')}>
              Date
            </Menu.Item>
            <Menu.Item onClick={() => console.log('Sort: Size')}>
              Size
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        {/* Filter Menu */}
        <Menu shadow="md" width={160} position="bottom-start">
          <Menu.Target>
            <Button
              variant="light"
              color="gray"
              radius="xl"
              size="xs"
              rightSection={<IconChevronDown size={12} />}
              styles={{ root: { padding: '4px 12px' } }}
            >
              Filter
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Filter by</Menu.Label>
            <Menu.Item onClick={() => console.log('Filter: All')}>
              All
            </Menu.Item>
            <Menu.Item onClick={() => console.log('Filter: Category A')}>
              Category A
            </Menu.Item>
            <Menu.Item onClick={() => console.log('Filter: Category B')}>
              Category B
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      <QuestionsTable />
    </Stack>
  );
}
