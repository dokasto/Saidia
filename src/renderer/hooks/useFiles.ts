import { useState } from 'react';
import { DIALOG_EVENTS, FILE_SYSTEM_EVENTS } from '../../constants/events';
import { FILE_EXTENSIONS } from '../../constants/misc';

export default function useFiles(subjectId: string | null) {
  const [files, setFiles] = useState<string[]>([]);

  async function add() {
    const options = {
      title: 'Select a file for your subject',
      properties: ['openFile', 'oneselection'],
      filters: [{ name: 'Allowed Files', extensions: FILE_EXTENSIONS }],
    };
    const result = await window.electron.ipcRenderer.invoke(
      DIALOG_EVENTS.SHOW_OPEN_DIALOG,
      options,
    );
    console.log('Add Result', result);

    if (!result.canceled && result.filePaths.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  async function getAll() {
    const response = await window.electron.ipcRenderer.invoke(
      FILE_SYSTEM_EVENTS.LIST_SUBJECT_FILES,
      subjectId,
    );
    console.log(response);
    if (response.success) {
      setFiles(response.data);
    } else {
      alert('Failed to get files');
    }
  }

  return {
    files,
    add,
    getAll,
  };
}
