import { KEYS, SCALE_DEGREES, Key } from '../types/song';

/**
 * Convert Nashville Number to Chord name based on key
 * Examples:
 *   "1" in key of G -> "G"
 *   "4" in key of C -> "F"
 *   "2-" in key of G -> "Am"
 */
export function nashvilleToChord(nashville: string, key: Key): string {
  // Extract the number (1-7) from the Nashville notation
  const match = nashville.match(/^([#b]?)([1-7])/);
  if (!match) return nashville;

  const accidental = match[1];
  const degree = parseInt(match[2]);
  const suffix = nashville.slice(match[0].length);

  // Get base chord from scale degree
  const keyIndex = KEYS.indexOf(key);
  if (keyIndex === -1) return nashville;

  let chordRoot = SCALE_DEGREES[degree][keyIndex];

  // Apply accidentals
  if (accidental === '#') {
    const rootIndex = KEYS.indexOf(chordRoot as Key);
    chordRoot = KEYS[(rootIndex + 1) % KEYS.length];
  } else if (accidental === 'b') {
    const rootIndex = KEYS.indexOf(chordRoot as Key);
    chordRoot = KEYS[(rootIndex - 1 + KEYS.length) % KEYS.length];
  }

  // Convert suffix notation from Nashville to chord symbols
  let chordSuffix = suffix
    .replace('-', 'm')
    .replace('−', 'm') // Handle different minus symbols
    .replace('maj7', 'maj7')
    .replace('7', '7')
    .replace('sus4', 'sus4')
    .replace('sus2', 'sus2')
    .replace('dim', 'dim')
    .replace('aug', 'aug')
    .replace('+', 'aug');

  return chordRoot + chordSuffix;
}

/**
 * Convert Chord name to Nashville Number based on key
 * Examples:
 *   "G" in key of G -> "1"
 *   "F" in key of C -> "4"
 *   "Am" in key of G -> "2-"
 */
export function chordToNashville(chord: string, key: Key): string {
  // Extract root note and suffix
  const match = chord.match(/^([A-G][#b]?)(.*)/);
  if (!match) return chord;

  const root = match[1];
  const suffix = match[2];

  // Find the scale degree
  const keyIndex = KEYS.indexOf(key);
  if (keyIndex === -1) return chord;

  let degree = 0;
  let accidental = '';

  // Check each scale degree
  for (let d = 1; d <= 7; d++) {
    const expectedRoot = SCALE_DEGREES[d][keyIndex];
    if (expectedRoot === root) {
      degree = d;
      break;
    }
  }

  // If not found in natural scale, check for accidentals
  if (degree === 0) {
    for (let d = 1; d <= 7; d++) {
      const naturalRoot = SCALE_DEGREES[d][keyIndex];
      const naturalIndex = KEYS.indexOf(naturalRoot as Key);

      // Check sharp
      const sharpRoot = KEYS[(naturalIndex + 1) % KEYS.length];
      if (sharpRoot === root) {
        degree = d;
        accidental = '#';
        break;
      }

      // Check flat
      const flatRoot = KEYS[(naturalIndex - 1 + KEYS.length) % KEYS.length];
      if (flatRoot === root) {
        degree = d;
        accidental = 'b';
        break;
      }
    }
  }

  if (degree === 0) return chord;

  // Convert suffix from chord symbols to Nashville
  let nashvilleSuffix = suffix
    .replace('m', '-')
    .replace('maj7', 'maj7')
    .replace('7', '7')
    .replace('sus4', 'sus4')
    .replace('sus2', 'sus2')
    .replace('dim', 'dim')
    .replace('aug', '+');

  return accidental + degree + nashvilleSuffix;
}
