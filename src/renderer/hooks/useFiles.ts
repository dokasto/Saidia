import { useState } from 'react';
import { notifications } from '@mantine/notifications';
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
      subjectId,
    );
  }

  async function getAll() {
    const response = await window.electron.ipcRenderer.invoke(
      FILE_SYSTEM_EVENTS.LIST_SUBJECT_FILES,
      subjectId,
    );
    if (response.success) {
      setFiles(response.data);
    } else {
      notifications.show({
        title: 'Error',
        message: 'Failed to get files. Please try again.',
      });
    }
  }

  async function deleteFile(fileName: string) {
    if (!subjectId) return false;

    const response = await window.electron.ipcRenderer.invoke(
      FILE_SYSTEM_EVENTS.DELETE_SUBJECT_FILE,
      subjectId,
      fileName,
    );

    if (response.success) {
      setFiles((prevFiles) => prevFiles.filter((f) => f !== fileName));
      notifications.show({
        title: 'File Deleted',
        message: `"${fileName}" was deleted successfully.`,
      });
      return true;
    } else {
      notifications.show({
        title: 'Delete Failed',
        message: 'Failed to delete file. Please try again.',
      });
      return false;
    }
  }

  return {
    files,
    add,
    getAll,
    deleteFile,
  };
}
