/* eslint-disable no-use-before-define */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Loader, Text, Progress } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { LLMInitialisationProgress } from '../../main/llm/services';

const formatBytesToMB = (bytes: number): string => {
  const mb = Math.round(bytes / (1024 * 1024));
  return `${mb} MB`;
};

export default function SplashScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<LLMInitialisationProgress | null>(
    null,
  );
  const subscription = useRef<() => void>(() => {});

  const handleProgress = useCallback(
    (p: LLMInitialisationProgress) => {
      setProgress(p);
    },
    [setProgress],
  );

  useEffect(() => {
    subscription.current =
      window.electron.llm.onInitialisationProgress(handleProgress);
  }, [handleProgress]);

  useEffect(() => {
    return () => {
      subscription.current?.();
    };
  }, []);

  useEffect(() => {
    if (progress?.completed === true) {
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  }, [progress?.completed, navigate]);

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.content)}>
        <div {...stylex.props(styles.title)}>Saidia</div>
        <Text size="lg" fw={500}>
          AI Teacher's Assistants
        </Text>
        {progress?.completed !== true && (
          <div {...stylex.props(styles.loaderContent)}>
            {progress?.percentage && progress.percentage > 0 ? (
              <div {...stylex.props(styles.progress)}>
                <Progress.Root size={18}>
                  <Progress.Section value={progress.percentage} color="gray">
                    <Progress.Label>{progress.percentage}%</Progress.Label>
                  </Progress.Section>
                </Progress.Root>
              </div>
            ) : (
              <Loader color="gray" size={18} />
            )}

            <Text size="xs">
              {progress?.downloaded && progress?.total
                ? `${progress?.status || 'Downloading'} - ${formatBytesToMB(progress.downloaded)} / ${formatBytesToMB(progress.total)}`
                : progress?.status || 'Setting up, please wait...'}
            </Text>
          </div>
        )}
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
  progress: {
    width: '100%',
  },
  loaderContent: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  container: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  title: {
    color: 'black',
    fontSize: 46,
  },
});
