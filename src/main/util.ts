import { URL } from 'url';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log('Directory created:', dirPath);
    } catch (error) {
      console.error('Failed to create directory:', error);
      throw error;
    }
  }
}

export async function copyDirectory(
  source: string,
  destination: string,
): Promise<void> {
  await fs.promises.mkdir(destination, { recursive: true });

  const entries = await fs.promises.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destPath);
    } else if (entry.isSymbolicLink()) {
      const target = await fs.promises.readlink(sourcePath);
      await fs.promises.symlink(target, destPath);
    } else {
      await fs.promises.copyFile(sourcePath, destPath);

      if (entry.name === 'ollama') {
        await fs.promises.chmod(destPath, '755');
      }
    }
  }
}

export function uniqueID(): string {
  return crypto.randomUUID();
}
