import * as fs from 'fs';
import { promisify } from 'util';
import mammoth from 'mammoth';
import { removeCitations, removeHyperlinks } from './clean';
import extractSectionsAndContent, { Section } from './parse-html';

const readFile = promisify(fs.readFile);

export default async function parseDocx(filePath: string): Promise<Section[]> {
  const docx = await readFile(filePath);
  const doc = await mammoth.convertToHtml({ buffer: docx });

  if (!doc.value) {
    return [];
  }

  let html = removeCitations(doc.value);
  html = removeHyperlinks(html);

  return extractSectionsAndContent(html);
}
