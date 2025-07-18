import React from 'react';
import { AppShell, Burger } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import SideMenu from './SideMenu';
import { APP_NAME } from '../../constants/misc';
import Main from './Main';

export default function Dashboard() {
  const [opened, { toggle }] = useDisclosure();

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
        <SideMenu />
      </AppShell.Navbar>

      <AppShell.Main>
        <Main />
      </AppShell.Main>
    </AppShell>
  );
}
