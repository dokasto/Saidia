import mammoth from 'mammoth';
import { removeCitations, removeHyperlinks } from './clean';
import extractSectionsAndContent, { Section } from './parse-html';

export default async function parseDocx(docx: Buffer): Promise<Section[]> {
  let doc = await mammoth.convertToHtml({ buffer: docx });

  if (!doc.value) {
    return [];
  }

  let html = removeCitations(doc.value);
  html = removeHyperlinks(html);

  return extractSectionsAndContent(html);
}
