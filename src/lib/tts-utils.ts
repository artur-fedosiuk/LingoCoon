/**
 * Remove legacy XML-style markers before plain-text speech synthesis.
 */
export function prepareTtsText(text: string): string {
  return text
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
