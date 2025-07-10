export interface TEmbedding {
  chunk_id: string;
  subject_id: string;
  file_id: string;
  text: string;
  embedding: number[];
  distance?: number;
}
