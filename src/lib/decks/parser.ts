import type { ParsedDeck, RawCard } from '../utils/types';

export function parseDeck(raw: string): ParsedDeck {
  const lines = raw.split(/\r?\n/);
  let title: string | null = null;
  let titleCount = 0;
  const cards: RawCard[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ')) {
      titleCount++;
      if (titleCount > 1) {
        errors.push(`Zeile ${i + 1}: Mehr als eine H1-Überschrift gefunden`);
      } else {
        title = trimmed.slice(2).trim();
      }
      continue;
    }

    const parts = trimmed.split(' - ');
    if (parts.length === 1) {
      errors.push(`Zeile ${i + 1}: Kein " - " gefunden: "${trimmed}"`);
      continue;
    }
    if (parts.length > 2) {
      errors.push(`Zeile ${i + 1}: Mehr als ein " - " gefunden: "${trimmed}"`);
      continue;
    }
    const front = parts[0].trim();
    const back = parts[1].trim();
    if (!front || !back) {
      errors.push(`Zeile ${i + 1}: Leere Vorder- oder Rückseite`);
      continue;
    }
    cards.push({ front, back });
  }

  if (titleCount === 0) errors.push('Keine H1-Überschrift gefunden');

  return { title, cards, errors };
}