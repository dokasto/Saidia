import { useState } from 'react';
import { TGeneratedQuestion } from '../../types';
import { LLM_EVENTS } from '../../constants/events';

export default function useGenerateQuestion(targetSubjectId: string) {
  const [questions, setQuestions] = useState<TGeneratedQuestion[]>([]);

  const generateQuestion = async (
    type: string,
    difficulty: string,
    count: number,
  ) => {
    try {
      const options = {
        count,
        difficulty,
        type,
      };

      const response = await window.electron.ipcRenderer.invoke(
        LLM_EVENTS.GENERATE_QUESTIONS,
        targetSubjectId,
        options,
      );

      if (response.success && response.data) {
        setQuestions(response.data);
        console.log('Generated Questions:', response.data);
      } else {
        console.error('Failed to generate questions:', response.error);
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      setQuestions([]);
    }
  };

  return { generateQuestion, questions };
}
