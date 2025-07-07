export const APP_NAME = 'Saidia';

export const FILE_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'txt',
  'jpg',
  'jpeg',
  'png',
  'bmp',
  'tiff',
  'webp',
  'md',
  'heic',
  'heif',
  'heif-sequence',
  'heic-sequence',
  'heif-sequence',
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
  GEMMA_3N_E4B_IT: 'gemma3n:e4b',
  NOMIC_EMBED_TEXT_V1_5: 'nomic-embed-text:v1.5',
} as const;

export const GEMMA3N_OPTIONS = {
  temperature: 0.7,
  top_p: 0.9,
  top_k: 50,
  max_tokens: 32768,
  do_sample: true,
  repetition_penalty: 1.1,
} as const;
