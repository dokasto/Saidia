import React from 'react';
import * as stylex from '@stylexjs/stylex';

export default function SplashScreen() {
  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.content)}>
        <div {...stylex.props(styles.title)}>Saidia</div>
        <div {...stylex.props(styles.subTitle)}>AI Teacher's Assistants</div>
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
    color: 'blue',
  },
  subTitle: {
    fontSize: 16,
    color: 'black',
  },
});
