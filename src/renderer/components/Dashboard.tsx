import React from 'react';
import { useState, useEffect } from 'react';
import { AppShell, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import SideMenu from './SideMenu';
import { APP_NAME } from '../../constants/misc';

export default function Dashboard() {
  const [activeSubject, setActiveSubject] = useState<string>(
    'No Selected Subject',
  );
  const [opened, { toggle }] = useDisclosure();

  function handleSelectSubject(subjectName: string) {
    setActiveSubject(subjectName ?? 'No Selected Subject');
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <div>{APP_NAME}</div>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <SideMenu
          onSelectSubject={handleSelectSubject}
          activeSubject={activeSubject}
        />
      </AppShell.Navbar>

      <AppShell.Main>{activeSubject}</AppShell.Main>
    </AppShell>
  );
}
