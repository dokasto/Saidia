import fs from 'fs/promises';
import { singlePdfToImg } from 'pdftoimg-js';

import { Section } from './parse-html';
import parseImage from './parse-image';

export default async function parsePdf(filePath: string): Promise<Section[]> {
  try {
    console.log('Converting PDF to images for OCR processing...');

    const result = await singlePdfToImg(filePath, {
      pages: 'all',
      imgType: 'jpg',
      scale: 2,
      background: 'white',
    });

    const base64Image = result[0] as string;

    return await parseImage({ base64Image, saveImage: true });
  } catch (error) {
    console.error('Error in OCR processing:', error);
    throw new Error(
      `OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
