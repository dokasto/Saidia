import React from 'react';
import * as stylex from '@stylexjs/stylex';
import { Loader, Text } from '@mantine/core';

export default function SplashScreen() {
  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.content)}>
        <div {...stylex.props(styles.title)}>Saidia</div>
        <Text size="lg" fw={500}>
          AI Teacher's Assistants
        </Text>
        <div {...stylex.props(styles.loaderContent)}>
          <Loader color="gray" size="xs" />
          <Text size="xs">Setting up, please wait...</Text>
        </div>
      </div>
    </div>
  );
}

const styles = stylex.create({
  content: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
  },
  loaderContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 46,
    color: 'black',
  },
  subTitle: {
    fontSize: 16,
    color: 'black',
  },
});
