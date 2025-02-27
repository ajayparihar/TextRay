const stopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'the', 'this', 'but', 'they',
  'have', 'had', 'what', 'when', 'where', 'who', 'which', 'why', 'how'
]);

interface ComparisonResult {
  commonWords: Set<string>;
  similarity: number;
  count: number;
}

export const compareTexts = (text1: string, text2: string): ComparisonResult => {
  // Early return for identical texts
  if (text1 === text2) {
    const words = text1.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const nonStopWords = words.filter(word => !stopWords.has(word));
    return {
      commonWords: new Set(nonStopWords),
      similarity: 100,
      count: nonStopWords.length
    };
  }

  // Convert texts to lowercase and split into words
  const words1 = text1.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  const words2 = text2.toLowerCase().split(/\s+/).filter(word => word.length > 0);

  // Create word frequency maps (including stop words for better accuracy)
  const freqMap1 = new Map<string, number>();
  const freqMap2 = new Map<string, number>();

  words1.forEach(word => {
    freqMap1.set(word, (freqMap1.get(word) || 0) + 1);
  });

  words2.forEach(word => {
    freqMap2.set(word, (freqMap2.get(word) || 0) + 1);
  });

  // Calculate intersection and union for Jaccard similarity
  let intersection = 0;
  let union = 0;

  // Count common words (non-stop words only)
  const commonWords = new Set<string>();
  
  for (const [word, count1] of freqMap1) {
    if (!stopWords.has(word)) {
      const count2 = freqMap2.get(word) || 0;
      intersection += Math.min(count1, count2);
      union += Math.max(count1, count2);
      if (count2 > 0) {
        commonWords.add(word);
      }
    }
  }

  // Add remaining words from text2 to union
  for (const [word, count2] of freqMap2) {
    if (!stopWords.has(word) && !freqMap1.has(word)) {
      union += count2;
    }
  }

  // Calculate similarity using Jaccard similarity coefficient
  const similarity = union === 0 ? 0 : Math.round((intersection / union) * 100);

  return {
    commonWords,
    similarity,
    count: commonWords.size
  };
};

export const isStopWord = (word: string): boolean => {
  return stopWords.has(word.toLowerCase());
}; 