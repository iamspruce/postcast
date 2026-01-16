export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateMinutes(text: string, wpm = 155): number {
  const words = countWords(text);
  return words / wpm;
}
