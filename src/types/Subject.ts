export interface TSubject {
  subject_id: string;
  name: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface SubjectResponse {
  subject_id: string;
  name: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface DeleteSubjectResponse {
  deletionErrors?: string[];
}
