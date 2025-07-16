/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable no-case-declarations */
/* eslint-disable no-use-before-define */
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { app } from 'electron';
import parseDocx from './parse-docx';
import parseMd from './parse-md';
import { Section } from './parse-html';
import parseOdt from './parse-odt';
import parsePdf from './parse-pdf';
import parseTxt from './parse-text';
import { uniqueID } from '../util';
import { Embedding } from '../database/models';
import { FileService, SubjectService } from '../database/services';
import { generateEmbeddingPrompt } from '../llm/prompts';
import LLMService from '../llm/services';
import { PLATFORMS } from '../../constants/misc';

const copyFile = promisify(fs.copyFile);
const unlink = promisify(fs.unlink);

export async function uploadAndProcessFile(
  filePath: string,
  subjectId: string,
): Promise<{ success: boolean; error?: string }> {
  const doc = await loadFile(filePath);

  if (doc.length === 0) {
    return { success: false, error: 'File is empty' };
  }

  const originalFilename = path.basename(filePath);
  const storedFile = await storeFile(filePath, subjectId, originalFilename);

  if (storedFile == null) {
    return { success: false, error: 'Failed to store file' };
  }

  const fileId = storedFile.filename;

  const createFileResult = await FileService.createFile(
    fileId,
    subjectId,
    originalFilename,
    storedFile.storedPath,
  );

  if (createFileResult == null) {
    return {
      success: false,
      error: 'Failed to create file record in database',
    };
  }

  const subject = await SubjectService.getSubject(subjectId);
  if (subject == null) {
    console.warn('Subject not found');
    return {
      success: false,
      error: 'Subject not found',
    };
  }

  const removeFilesOnError = async () => {
    try {
      await FileService.deleteFile(fileId);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
    try {
      await removeFile(fileId);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const embeddings: number[][] = await embed(doc, subject.name);

  if (embeddings.length === 0) {
    await removeFilesOnError();
    return { success: false, error: 'Failed to create embeddings' };
  }

  let embeddingsInserted = 0;

  for (let i = 0; i < embeddings.length; i++) {
    if (doc[i]?.content != null && doc[i].content.length > 0) {
      Embedding.insertEmbedding(
        subjectId,
        fileId,
        doc[i].content.join('\n\n'),
        embeddings[i],
      );
      embeddingsInserted++;
    }
  }

  if (embeddingsInserted === 0) {
    await removeFilesOnError();
    return { success: false, error: 'Failed to insert embeddings' };
  }

  return { success: true };
}

export async function listSubjectFiles(subjectId: string): Promise<string[]> {
  const subjectDir = await getSubjectDirectory(subjectId);
  try {
    return await fs.promises.readdir(subjectDir);
  } catch (error) {
    console.error('Failed to list subject files:', error);
    return [];
  }
}

export async function deleteAllSubjectFiles(subjectId: string): Promise<void> {
  const subjectDir = await getSubjectDirectory(subjectId);
  try {
    await fs.promises.rm(subjectDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Failed to delete subject directory:', error);
  }
}

export async function deleteSubjectFile(
  subjectId: string,
  filename: string,
): Promise<void> {
  const filePath = await getSubjectFilePath(subjectId, filename);
  const errors = [];
  try {
    await removeFile(filePath);
  } catch (error) {
    errors.push(error);
  }

  try {
    await FileService.deleteFile(filename);
  } catch (error) {
    errors.push(error);
  }

  try {
    Embedding.deleteEmbeddingsByFile(filename);
  } catch (error) {
    errors.push(error);
  }

  if (errors.length > 0) {
    throw new Error(
      errors
        .map((error) => {
          if (error instanceof Error) {
            return error.message;
          }
          return String(error);
        })
        .join(', '),
    );
  }
}

async function loadFile(filePath: string): Promise<Section[]> {
  const fileExtension = path.extname(filePath).toLowerCase();
  switch (fileExtension) {
    case '.docx':
      return parseDocx(filePath);
    case '.md':
      return parseMd({ filePath });
    case '.odt':
      return parseOdt(filePath);
    case '.pdf':
      return parsePdf(filePath);
    default:
      return parseTxt(filePath);
  }
}

export async function removeFile(relativePath: string): Promise<void> {
  const { platform } = process;
  if (platform === PLATFORMS.MAC) {
    await deleteFileMac(relativePath);
  } else if (platform === PLATFORMS.WINDOWS) {
    await deleteFileWindows(relativePath);
  } else if (platform === PLATFORMS.LINUX) {
    await deleteFileLinux(relativePath);
  } else {
    await unlink(relativePath);
  }
}

async function storeFile(
  sourceFilePath: string,
  subjectId: string,
  originalFilename: string,
): Promise<{ storedPath: string; filename: string } | null> {
  const subjectDir = await getSubjectDirectory(subjectId);
  const fileExtension = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, fileExtension);
  const uniqueFilename = `${baseName}_${uniqueID()}${fileExtension}`;
  const storedPath = path.join(subjectDir, uniqueFilename);
  await copyFile(sourceFilePath, storedPath);
  return { storedPath, filename: uniqueFilename };
}

async function getSubjectDirectory(subjectId: string): Promise<string> {
  const dir = path.join(app.getPath('userData'), 'files', subjectId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
async function getSubjectFilePath(
  subjectId: string,
  filename: string,
): Promise<string> {
  const subjectDir = await getSubjectDirectory(subjectId);
  return path.join(subjectDir, filename);
}

async function embed(doc: Section[], subjectName: string): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const section of doc) {
    const prompt = generateEmbeddingPrompt(
      section.content.join('\n\n'),
      subjectName,
    );
    const result = await LLMService.createEmbedding(prompt);
    if (result.success && result.embeddings) {
      embeddings.push(...result.embeddings);
    } else {
      console.error('Failed to create embedding:', result.error);
    }
  }
  return embeddings;
}

async function deleteFileMac(relativePath: string): Promise<void> {
  try {
    await unlink(relativePath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

async function deleteFileWindows(relativePath: string): Promise<void> {
  const absolutePath = path.resolve(relativePath);
  try {
    await unlink(absolutePath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return;
    }
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
      await unlink(absolutePath);
    } else {
      throw error;
    }
  }
}

async function deleteFileLinux(relativePath: string): Promise<void> {
  try {
    await unlink(relativePath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}
