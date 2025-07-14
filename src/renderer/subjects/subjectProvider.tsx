import React, {
  createContext,
  ReactNode,
  useCallback,
  useState,
  useMemo,
  useEffect,
} from 'react';
import { TSubject } from '../../types';
import { SUBJECT_EVENTS } from '../../constants/events';

type Props = {
  children: ReactNode;
};

type SubjectContextType = {
  getAll: () => Promise<TSubject[]>;
  create: (title: string) => Promise<Boolean>;
  changeName: (subjectId: string, newName: string) => Promise<Boolean>;
  remove: (subjectId: string) => Promise<Boolean>;
  selected: TSubject | null;
  select: (id: string) => void;
  subjects: TSubject[];
};

export const SubjectContext = createContext<SubjectContextType>({
  getAll: () => Promise.resolve([]),
  create: (title: string) => Promise.resolve(true),
  selected: null,
  changeName: (subjectId: string, newName: string) => Promise.resolve(true),
  remove: (subjectId: String) => Promise.resolve(true),
  subjects: [],
  select: (id: string) => {},
});

export default function SubjectProvider({ children }: Props) {
  const [subjects, setSubjects] = useState<TSubject[]>([]);
  const [selected, setSelected] = useState<TSubject | null>(null);

  const getAll = useCallback(async (): Promise<TSubject[]> => {
    const response = await window.electron.ipcRenderer.invoke(
      SUBJECT_EVENTS.GET_ALL,
    );

    if (response.success && response.data) {
      setSubjects(response.data);
    }
    return response.data;
  }, []);

  const create = useCallback(async (title: string): Promise<Boolean> => {
    const response = await window.electron.ipcRenderer.invoke(
      SUBJECT_EVENTS.CREATE,
      title,
    );

    return response.success && response.data;
  }, []);

  const remove = useCallback(async (subjectId: string): Promise<Boolean> => {
    const response = await window.electron.ipcRenderer.invoke(
      SUBJECT_EVENTS.DELETE,
      subjectId,
    );

    return response.success;
  }, []);

  const changeName = useCallback(
    async (subjectId: string, newName: string): Promise<Boolean> => {
      const response = await window.electron.ipcRenderer.invoke(
        SUBJECT_EVENTS.UPDATE,
        subjectId,
        { name: newName },
      );

      return response.success;
    },
    [],
  );

  const select = useCallback(
    (id: string) => {
      for (const subject of subjects) {
        if (subject.subject_id === id) {
          setSelected(subject);
          return;
        }
      }
    },
    [subjects],
  );

  const value = useMemo(
    () => ({ getAll, create, selected, changeName, remove, subjects, select }),
    [getAll, create, selected, changeName, remove, subjects, select],
  );

  useEffect(() => {
    getAll();
  }, []);

  return (
    <SubjectContext.Provider value={value}>{children}</SubjectContext.Provider>
  );
}
