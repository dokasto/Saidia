import { removeCitations, removeHyperlinks } from './clean';
import extractSectionsAndContent, { Section } from './parse-html';

const odt2html = require('odt2html');

export default async function parseOdt(
  odtFilePath: string,
): Promise<Section[]> {
  let html = await odt2html.toHTML({ path: odtFilePath });

  if (html == null) return [];

  html = removeCitations(html);
  html = removeHyperlinks(html);

  return extractSectionsAndContent(html);
}
