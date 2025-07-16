import * as fs from 'fs';
import { promisify } from 'util';
import pdf2md from '@opendocsg/pdf2md';
import { Section } from './parse-html';
import parseMd from './parse-md';

const readFile = promisify(fs.readFile);

export default async function parsePdf(filePath: string): Promise<Section[]> {
  const pdfBuffer = await readFile(filePath);
  const markdownText = await pdf2md(pdfBuffer);
  return parseMd({ markdownText });
}
