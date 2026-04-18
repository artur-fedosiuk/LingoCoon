export interface SessionCard {
  // Identity
  id: string;
  deckId: string;

  // Content
  front: string;
  back: string;
  exampleSentence: string | null;
  pronunciation: string | null;

  // FSRS state (null = card never studied)
  easeFactor: number | null;
  interval: number | null;
  repetitions: number | null;
  nextReviewDate: string | null;

  // Session state
  isFlipped: boolean;
}