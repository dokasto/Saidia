export * from './File';
export * from './Subject';
export * from './Question';
export * from './Embedding';

export type IPCResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};
