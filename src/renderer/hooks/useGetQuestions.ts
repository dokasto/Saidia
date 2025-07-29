import { useEffect, useState } from 'react';
import { TQuestion } from '../../types';
import { QUESTION_EVENTS } from '../../constants/events';

export default function useGetQuestions(subjectId: string) {
  const [questions, setQuestions] = useState<TQuestion[]>([]);

  const getQuestions = async () => {
    const response = await window.electron.ipcRenderer.invoke(
      QUESTION_EVENTS.GET_ALL,
      { subjectId },
    );

    if (response.success) {
      setQuestions(response.data);
      console.log('All Questions', response.data);
    } else {
      console.error('Failed to fetch questions:', response.error);
    }
  };

  useEffect(() => {
    getQuestions();
  }, [subjectId]);

  return { questions, getQuestions };
}
