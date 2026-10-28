export interface CardState {
    box: number;
    lastSeen: number;
}

export type CardStates = Record<string, CardState>;

/** Number of Leitner boxes; a card in box BOX_COUNT counts as learned. */
export const BOX_COUNT = 6;

/** Display labels per box: roman numerals, the last box is "learned". */
export const BOX_LABELS = ["I", "II", "III", "IV", "V", "Gelernt"] as const;
