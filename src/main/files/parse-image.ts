import LLMService from '../llm/LLM-Service';
import parseMd from './parse-md';
import { Section } from './parse-html';
import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

export default async function parseImage({
  filePath,
  base64Image,
  saveImage = false,
  imageName = 'extracted_image',
}: {
  filePath?: string;
  base64Image?: string;
  saveImage?: boolean;
  imageName?: string;
}): Promise<Section[]> {
  try {
    let finalBase64Image: string;

    // Determine the source and get base64 image
    if (base64Image) {
      console.log('Using provided base64 image...');
      finalBase64Image = base64Image;
    } else if (filePath) {
      console.log('Converting file to base64...');
      finalBase64Image = await fileToBase64(filePath);
    } else {
      throw new Error('Either filePath or base64Image must be provided');
    }

    finalBase64Image = finalBase64Image.startsWith('data:')
      ? finalBase64Image.split(',')[1]
      : finalBase64Image;

    // Save the image if requested
    if (saveImage) {
      const savedPath = await saveBase64ImageToFile(
        finalBase64Image,
        imageName,
      );
      console.log('Image saved to:', savedPath);
    }

    console.log('Extracting text from image...');
    const extractedText = await extractTextFromBase64(finalBase64Image);

    console.log('Text extraction completed, length:', extractedText.length);

    // Convert the extracted text to markdown format for consistent processing
    const markdownText = `# Extracted Text\n\n${extractedText}`;

    // Parse the markdown to get sections
    return parseMd(markdownText);
  } catch (error) {
    console.error('Error in image processing:', error);
    throw new Error(
      `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

// Helper function to convert file to base64
async function fileToBase64(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return buffer.toString('base64');
}

// Helper function to save base64 image to file within app directory
async function saveBase64ImageToFile(
  base64Image: string,
  imageName: string,
): Promise<string> {
  try {
    // Get the user data directory (persists across app restarts)
    const userDataPath = app.getPath('userData');
    const imagesDir = path.join(userDataPath, 'files', 'extracted_images');

    // Create the images directory if it doesn't exist
    await fs.mkdir(imagesDir, { recursive: true });

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const filename = `${imageName}_${timestamp}.jpg`;
    const filePath = path.join(imagesDir, filename);

    // Convert base64 to buffer and write to file
    const buffer = Buffer.from(base64Image, 'base64');
    await fs.writeFile(filePath, buffer);

    console.log(`Image saved successfully: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error saving base64 image to file:', error);
    throw new Error(
      `Failed to save image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

// Helper function to extract text from base64 image using LLM
async function extractTextFromBase64(base64Image: string): Promise<string> {
  const result = await LLMService.generate({
    model: LLMService.MODEL_NAME,
    prompt:
      'Read and transcribe all the text visible in this image. Return only the text content, maintaining the original formatting and structure.',
    images: [base64Image],
    options: LLMService.GEMMA3N_OPTIONS,
  });

  // Check if the operation was successful
  if (!result.success) {
    throw new Error(`LLM service failed: ${result.error || 'Unknown error'}`);
  }

  if (!result.response) {
    throw new Error('No text could be extracted from the image');
  }

  return result.response;
}
