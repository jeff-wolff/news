const stringSimilarity = require('string-similarity');

export async function identifyDuplicates(text) {
  const sentences = text.split(/(?<=[.!?])\s+/); // Split the text into sentences using regex to handle different punctuation marks.

  const duplicates = [];
  const duplicatesIndices = [];

  for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
      const similarity = stringSimilarity.compareTwoStrings(sentences[i], sentences[j]);

      if (similarity > 0.9 && !duplicatesIndices.includes(j) && isFullSentence(sentences[j])) {
        duplicates.push(sentences[j]);
        duplicatesIndices.push(j);
      }
    }
  }

  return duplicates;
}

function isFullSentence(sentence) {
  const sentenceEndingPunctuation = ['.', '!', '?'];
  const trimmedSentence = sentence.trim();

  if (trimmedSentence.length === 0) {
    return false;
  }

  const lastChar = trimmedSentence.charAt(trimmedSentence.length - 1);

  return sentenceEndingPunctuation.includes(lastChar);
}
