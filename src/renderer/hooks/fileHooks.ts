import { useState } from 'react';
import { DIALOG_EVENTS, FILE_SYSTEM_EVENTS } from '../../constants/events';

export default function useFiles(subjectId: string | null) {
  const [filesBySubject, setFilesBySubject] = useState<
    Record<string, string[]>
  >({});

  const files = subjectId ? filesBySubject[subjectId] || [] : [];

  async function addFiles(subjectId: string) {
    const options = {
      title: 'Select a file for your subject',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Allowed Files', extensions: ['tsx', 'pdf'] }],
    };
    const result = await window.electron.ipcRenderer.invoke(
      DIALOG_EVENTS.SHOW_OPEN_DIALOG,
      options,
    );

    if (!result.canceled && result.filePaths.length > 0) {
      alert('success!');
      setFilesBySubject((prev) => {
        const existingFiles = prev[subjectId] || [];
        return {
          ...prev,
          [subjectId]: [...existingFiles, ...result.filePaths],
        };
      });
    }
  }

  async function listFiles(subjectId: string) {
    const response = await window.electron.ipcRenderer.invoke(
      FILE_SYSTEM_EVENTS.LIST_SUBJECT_FILES,
      subjectId,
    );

    if (response.success) {
      setFilesBySubject((prev) => ({
        ...prev,
        [subjectId]: response.data,
      }));
    } else {
      alert('Failed to get files');
    }
  }

  return {
    files,
    addFiles,
    listFiles,
    filesBySubject,
  };
}
