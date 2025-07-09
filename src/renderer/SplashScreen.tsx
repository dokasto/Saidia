import React, { useCallback, useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Loader, Text, Progress } from '@mantine/core';
import { LLMServiceProgress } from '../main/llm/services';
import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<LLMServiceProgress | null>(null);

  const handleProgress = useCallback(
    (progress: LLMServiceProgress) => {
      setProgress(progress);
    },
    [setProgress],
  );

  useEffect(() => {
    window.electron.llm.onProgress(handleProgress);
    window.electron.llm.init();
  }, [handleProgress]);

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
              {progress?.status || 'Setting up, please wait...'}
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
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
