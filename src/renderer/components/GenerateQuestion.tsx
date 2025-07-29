import React, { useState } from 'react';
import { Select, Slider, Stack, Group, Text, Box, Button } from '@mantine/core';
import { QuestionType, QuestionDifficulty } from '../../constants/misc';
import useGenerateQuestion from '../hooks/useGenerateQuestion';
import { TQuestionDifficulty, TSubject } from '../../types';
import QuestionEditorModal from './QuestionEditorModal';

const questionTypeOptions = Object.values(QuestionType).map((value) => ({
  value,
  label: value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
}));

const difficultyOptions = Object.values(QuestionDifficulty).map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

type Props = {
  subject: TSubject;
  onSaved: () => Promise<void>;
};

export default function GenerateQuestion({ subject, onSaved }: Props) {
  const { generateQuestion, questions } = useGenerateQuestion(
    subject.subject_id,
  );

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<TQuestionDifficulty | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(1);
  const [modalOpen, setModalOpen] = useState(false);

  const handleGenerate = async () => {
    try {
      await generateQuestion(
        subject.subject_id,
        selectedType,
        selectedDifficulty,
        numQuestions,
      );
      setModalOpen(true);
    } catch (err) {
      console.error('Failed to generate questions:', err);
    }
  };

  return (
    <Stack>
      <h3 style={{ margin: 0 }}>Generate Question</h3>
      <Group>
        <Select
          placeholder="Question Type"
          data={questionTypeOptions}
          value={selectedType}
          onChange={setSelectedType}
          nothingFoundMessage="Question type not found..."
        />

        <Select
          placeholder="Difficulty"
          data={difficultyOptions}
          value={selectedDifficulty}
          onChange={setSelectedDifficulty}
          w={120}
        />

        <Box w={180}>
          <Text size="sm" fw={500} mb={-4}>
            Number of Questions
          </Text>
          <Slider
            min={1}
            max={20}
            color="black"
            value={numQuestions}
            onChange={setNumQuestions}
          />
        </Box>

        <Button
          color="black"
          px="md"
          size="m"
          onClick={handleGenerate}
          disabled={!selectedType || !selectedDifficulty}
        >
          Generate
        </Button>
      </Group>

      <QuestionEditorModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        questions={questions}
        questionType={selectedType}
        subject={subject}
        selectedDifficulty={selectedDifficulty}
        selectedType={selectedType}
        onSaved={onSaved}
      />
    </Stack>
  );
}
