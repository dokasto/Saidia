export const APP_NAME = 'Saidia';

export const FILE_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'txt',
  'md',
  'odt',
] as const;

export const PLATFORMS = {
  LINUX: 'linux',
  WINDOWS: 'win32',
  MAC: 'darwin',
} as const;

export const ARCHS = {
  AMD64: 'amd64',
  ARM64: 'arm64',
  X86: 'x86',
} as const;

export const OLLAMA_DOWNLOAD_URLS = {
  MAC: 'https://github.com/ollama/ollama/releases/download/v0.9.5/Ollama.dmg',
  WINDOWS:
    'https://github.com/ollama/ollama/releases/download/v0.9.5/ollama-windows-amd64.zip',
  LINUX: {
    AMD64:
      'https://github.com/ollama/ollama/releases/download/v0.9.5/ollama-linux-amd64',
    ARM64:
      'https://github.com/ollama/ollama/releases/download/v0.9.5/ollama-linux-arm64',
  },
} as const;

export const MODELS = {
  GEMMA_3N_E4B_IT_FP16: 'gemma3n:e4b-it-fp16',
  GEMMA3N_E2B_IT_Q4_K_M: 'gemma3n:e2b-it-q4_K_M',
  NOMIC_EMBED_TEXT_V1_5: 'nomic-embed-text:v1.5',
} as const;

export const CONFIG_MODELS = {
  EMBEDDING_MODEL: MODELS.NOMIC_EMBED_TEXT_V1_5,
  QUESTION_GENERATION_MODEL: MODELS.GEMMA_3N_E4B_IT_FP16,
} as const;

export const QuestionDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export const QuestionType = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  FILL_IN_THE_BLANK: 'fill_in_the_blank',
} as const;
