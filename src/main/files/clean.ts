function removeImages(content: string) {
  return content.replace(/!\[\[.*?\]\]/g, '');
}

function removeHyperlinks(content: string) {
  return content.replace(/\[(.*?)\]\((.*?)\)/g, '$1');
}

function removeCitations(content: string) {
  return content.replace(/\[\d+\]/g, '');
}

function splitText(text: string) {
  let cleanedText = text.replace(/\n/g, ' ');
  cleanedText = cleanedText.replace(/\s+/g, ' ');
  cleanedText = removeCitations(cleanedText);
  cleanedText = removeHyperlinks(cleanedText);
  cleanedText = removeImages(cleanedText);

  if (cleanedText.includes('.')) {
    const sentenceRegex = /(?<!\w\.\w)(?<![A-Z][a-z]\.)(?<=[.!?])\s+(?=[A-Z])/g;
    return cleanedText.split(sentenceRegex);
  }

  // chunk size for nomic-embed-text
  // 2K tokens ≈ 8000 characters (conservative estimate)
  // Using 6000 characters to leave room for model overhead and ensure we stay within limits
  const chunkSize = 6000;
  const chunks = [];
  for (let i = 0; i < cleanedText.length; i += chunkSize) {
    chunks.push(cleanedText.substring(i, i + chunkSize));
  }
  return chunks;
}

export { removeImages, removeHyperlinks, removeCitations, splitText };
