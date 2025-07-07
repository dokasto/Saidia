const odt2html = require('odt2html');

import { Section } from './parse-html';
import { removeCitations, removeHyperlinks } from './clean';
import extractSectionsAndContent from './parse-html';

export default async function parseOdt(
  odtFilePath: string,
): Promise<Section[]> {
  try {
    let html = await odt2html.toHTML({ path: odtFilePath });

    if (!html || !html.value) {
      return [];
    }

    html = removeCitations(html);
    html = removeHyperlinks(html);

    return extractSectionsAndContent(html);
  } catch (err) {
    console.error('Error parsing ODT file:', err);
    return [];
  }
}
