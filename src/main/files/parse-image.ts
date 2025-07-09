import LLMService from '../llm/services';
import parseMd from './parse-md';
import { Section } from './parse-html';
import { CONFIG_MODELS } from '../../constants/misc';

export default async function parseImage(
  base64Image: string,
): Promise<Section[]> {
  try {
    const finalBase64Image = base64Image.startsWith('data:')
      ? base64Image.split(',')[1]
      : base64Image;

    const extractedText = await extractTextFromBase64(finalBase64Image);
    const markdownText = `# Extracted Text\n\n${extractedText}`;

    return parseMd(markdownText);
  } catch (error) {
    console.error('Error in image processing:', error);
    throw new Error(
      `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

async function extractTextFromBase64(base64Image: string): Promise<string> {
  console.info('Using LLM to extract text from image');

  const result = await LLMService.generate({
    model: CONFIG_MODELS.VISION_MODEL,
    prompt:
      'Extract all text from this image. Return only the raw text content without any explanations or formatting. Do not include any other text in your response.',
    images: [base64Image],
    stream: false,
  });

  if (!result.success) {
    throw new Error(`LLM service failed: ${result.error || 'Unknown error'}`);
  }

  if (!result.response) {
    throw new Error('No text could be extracted from the image');
  }

  return result.response;
}
