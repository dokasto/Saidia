/* eslint-disable prefer-template */
import * as fs from 'fs';
import { promisify } from 'util';
import { splitText } from './clean';
import { Section } from './parse-html';

const readFile = promisify(fs.readFile);

export default async function parseMd({
  filePath,
  markdownText,
}: {
  filePath?: string;
  markdownText?: string;
}): Promise<Section[]> {
  const markdown = filePath ? await readFile(filePath, 'utf-8') : markdownText;

  if (markdown == null) return [];

  const sections: Section[] = [];
  const lines = markdown.split('\n');

  let header: string | null = null;
  let text = '';

  lines.forEach((line) => {
    const isHeader = line.match(/^#+\s/);
    if (isHeader) {
      if (header !== null) {
        if (text === '') {
          return;
        }
        sections.push({
          section: header,
          content: splitText(text),
        });
      }

      header = line.replace(/#/g, '').trim();
      text = '';
    } else {
      text += line + '\n';
    }
  });

  sections.push({
    section: header ?? '',
    content: splitText(text),
  });

  return sections;
}
