/**
 * Remove legacy XML-style markers before plain-text speech synthesis.
 */
export function prepareTtsText(text: string): string {
  let sanitized = text;
  let previous: string;

  do {
    previous = sanitized;
    sanitized = sanitized.replace(/<\/?[a-zA-Z][^>]*>/g, '');
  } while (sanitized !== previous);

  return sanitized.replace(/\s{2,}/g, ' ').trim();
}
