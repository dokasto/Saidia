/* eslint-disable no-cond-assign */
import { splitText } from './clean';

export interface Section {
  section: string;
  content: string[];
}

export default function parseHtml(html: string): Section[] {
  // Remove all content within tags except for <h1> to <h6> and <p>
  const cleanedHtml = html.replace(
    /<(?!\/?(h[1-6]|p)(?=>|\s.*>))\/?.*?>/gi,
    '',
  );

  // Split into sections based on heading tags
  const sectionRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>|<p[^>]*>(.*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  let currentSection: Section = {
    section: '',
    content: [],
  };
  const extractedSections: Section[] = [];

  while ((match = sectionRegex.exec(cleanedHtml)) !== null) {
    if (match[0].startsWith('<h')) {
      // If there's a current section with content, push it to the array
      if (currentSection.section !== '' || currentSection.content.length > 0) {
        extractedSections.push(currentSection);
        currentSection = { section: '', content: [] };
      }
      currentSection.section = match[1].trim(); // Set new section title
    } else if (match[0].startsWith('<p')) {
      const paragraphText = match[2].trim();
      if (paragraphText) {
        const splitParagraph = splitText(paragraphText);
        currentSection.content.push(...splitParagraph);
      }
    }
  }

  // Push the last section if it has content
  if (currentSection.section !== '' || currentSection.content.length > 0) {
    extractedSections.push(currentSection);
  }

  return extractedSections;
}
