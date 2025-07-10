export interface TFile {
  file_id: string;
  subject_id: string;
  filename: string;
  filepath: string;
}

export interface FileResponse {
  file_id: string;
  subject_id: string;
  filename: string;
  filepath: string;
}

export interface DeleteFileResponse {
  deleteCount: boolean;
}

export interface UpdateFileResponse {
  updatedCount: boolean;
}
