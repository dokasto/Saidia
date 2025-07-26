import { useState } from 'react';
import { TGeneratedQuestion } from '../../types';
import { LLM_EVENTS } from '../../constants/events';

export function useGenerateQuestion(subjectId: string | null) {
  const [questions, setQuestions] = useState<TGeneratedQuestion[]>([]);

  const generateQuestion = async (
    subjectId: string,
    type: string,
    difficulty: string,
    count: number,
  ) => {
    const mockResponse: TGeneratedQuestion[] = [
      {
        question: 'What is the time complexity of binary search?',
        choices: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
        answer: 1,
      },
      {
        question: 'Explain the difference between stack and queue.',
        choices: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
      },
      {
        question: 'Write a function to reverse a linked list.',
        choices: [],
      },
    ];

    setQuestions(mockResponse);
    console.log('Generated Questions:', mockResponse);
  };

  return { generateQuestion, questions };
}
