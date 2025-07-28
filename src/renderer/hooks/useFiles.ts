import { useState } from 'react';
import { DIALOG_EVENTS, FILE_SYSTEM_EVENTS } from '../../constants/events';
import { FILE_EXTENSIONS } from '../../constants/misc';
import { notifications } from '@mantine/notifications';

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

    if (result.success) {
      notifications.show({
        title: 'Uploaded!',
        message: 'File has been uploaded!',
        color: 'black',
        style: { backgroundColor: 'rgba(144, 238, 144, 0.2)' },
      });
    } else {
      notifications.show({
        title: 'Failed',
        message: 'Failed to upload file!',
        color: 'black',
        style: { backgroundColor: 'rgba(251, 76, 76, 0.25)' },
      });
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
        title: 'Deleted',
        message: 'File has been deleted!',
        color: 'black',
        style: { backgroundColor: 'rgba(144, 238, 144, 0.2)' },
      });
      return true;
    } else {
      notifications.show({
        title: 'Failed',
        message: 'Failed to delete file!',
        color: 'black',
        style: { backgroundColor: 'rgba(251, 76, 76, 0.25)' },
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
