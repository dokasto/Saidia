import { useState } from 'react';
import { LLM_EVENTS } from '../../constants/events';

export function useGenerateQuestion(subjectId: string | null) {
  const [questions, setQuestions] = useState([]);

  const generateQuestion = async (subjectId, type, difficulty, count) => {
    // const response = await window.electron.ipcRenderer.invoke(
    //   LLM_EVENTS.GENERATE_QUESTIONS,
    //   subjectId,
    //   {
    //     type,
    //     difficulty,
    //     count,
    //   },
    // );
    // if (response.success) {
    //   setQuestions(response);
    //   console.log('Generated Questions:', response);
    // } else {
    //   console.error('Error:', response.error);
    // }

    const mockResponse = {
      success: true,
      data: [
        {
          question: 'What is the time complexity of binary search?',
          options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
          correctAnswer: 'O(log n)',
          difficulty: 'easy',
          type: 'mcq',
        },
        {
          question: 'Explain the difference between stack and queue.',
          options: [],
          correctAnswer: 'A stack is LIFO, a queue is FIFO.',
          difficulty: 'medium',
          type: 'text',
        },
        {
          question: 'Write a function to reverse a linked list.',
          options: [],
          correctAnswer: '// implementation here',
          difficulty: 'hard',
          type: 'code',
        },
      ],
    };
    setQuestions(mockResponse.data);
    console.log('Generated (mock) Questions:', mockResponse);
  };

  return { generateQuestion, questions };
}
