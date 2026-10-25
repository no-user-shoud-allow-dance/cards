export interface RawCard {
  front: string;
  back: string;
}

export interface Card extends RawCard {
  id: string;
}

export interface ParsedDeck {
  title: string | null;
  cards: RawCard[];
  errors: string[];
}

export interface LoadedDeck {
  slug: string;
  folder: string;
  name: string;
  deckType: DeckType;
  /** Whether this deck offers a pure mode (defined by its deck type). */
  pureMode: boolean;
  title: string | null;
  cards: Card[];
  errors: string[];
}

/** A deck uploaded by the user; persisted in IndexedDB, never on a server. */
export interface UserDeck {
  slug: string;
  name: string;
  folder: string;
  deckType: DeckType;
  /** Raw markdown source, as uploaded or received via a share link. */
  raw: string;
  /**
   * Content identity of the deck (hashDeckContent over raw + deckType).
   * The slug is derived from this, and progress links reference it.
   */
  contentHash: string;
  createdAt: number;
}

export interface CardState {
  box: number;
  lastSeen: number;
}

export type CardStates = Record<string, CardState>;

export type DeckType = 'english' | 'latin' | 'greek';

/** Number of Leitner boxes; a card in box BOX_COUNT counts as learned. */
export const BOX_COUNT = 6;

/** Display labels per box: roman numerals, the last box is "learned". */
export const BOX_LABELS = ['I', 'II', 'III', 'IV', 'V', 'Gelernt'] as const;
