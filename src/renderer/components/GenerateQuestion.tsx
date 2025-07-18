import React, { useState } from 'react';
import { Select, Slider, Stack, Group, Text, Box, Button } from '@mantine/core';
import { QuestionType, QuestionDifficulty } from '../../constants/misc';

const questionTypeOptions = Object.values(QuestionType).map((value) => ({
  value,
  label: value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
}));

const difficultyOptions = Object.values(QuestionDifficulty).map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1), // "easy" → "Easy"
}));

export default function GenerateQuestion() {
  return (
    <Stack>
      <h3 style={{ margin: 0 }}>Generate Question</h3>
      <Group>
        <Select
          placeholder="Question Type"
          data={questionTypeOptions}
          searchable
          nothingFoundMessage="Question type not found..."
        />

        <Select
          placeholder="difficulty"
          data={difficultyOptions}
          w={120}
          radius="xl"
          variant="default"
        />

        <Box w={180}>
          <Text size="sm" fw={500} mb={-4}>
            Number of Questions
          </Text>
          <Slider min={1} max={60} color="black" />
        </Box>

        <Button color="black" radius="xl" px="md" size="m">
          Generate Questions
        </Button>
      </Group>
    </Stack>
  );
}
