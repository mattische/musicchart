import { Chord } from '../types/song';

/**
 * Parse chord text into Chord objects and extract comment
 * Examples:
 *   "1" -> { chords: [{ number: "1", beats: 1 }], comment: undefined }
 *   "1..." -> { chords: [{ number: "1", beats: 3 }], comment: undefined }
 *   "4!" -> { chords: [{ number: "4", accent: true }], comment: undefined }
 *   "5-..." -> { chords: [{ number: "5-", beats: 3 }], comment: undefined }
 *   "2sus4!." -> { chords: [{ number: "2sus4", accent: true, beats: 1 }], comment: undefined }
 *   "1 4 5 //verse" -> { chords: [...], comment: "verse" }
 */
export function parseChordText(text: string, nashvilleMode: boolean): { chords: Chord[], comment?: string } {
  if (!text.trim()) return { chords: [] };

  // Check if there's a comment (starts with //)
  const commentIndex = text.indexOf('//');
  let chordText = text;
  let comment: string | undefined;

  if (commentIndex !== -1) {
    chordText = text.substring(0, commentIndex).trim();
    comment = text.substring(commentIndex + 2).trim();
  }

  const chords: Chord[] = [];
  if (!chordText.trim()) {
    return { chords, comment };
  }

  // Split by whitespace
  const tokens = chordText.trim().split(/\s+/);

  tokens.forEach((token, index) => {
    if (!token) return;

    // Extract accent mark (!)
    const hasAccent = token.includes('!');
    let workingToken = token.replace(/!/g, '');

    // Count dots for beats
    const dotMatch = workingToken.match(/\.+$/);
    const beats = dotMatch ? dotMatch[0].length : undefined;
    workingToken = workingToken.replace(/\.+$/, '');

    // The rest is the chord number/name
    const number = workingToken;

    if (number) {
      chords.push({
        id: `chord-${Date.now()}-${index}`,
        number,
        nashvilleMode,
        beats,
        accent: hasAccent || undefined,
      });
    }
  });

  return { chords, comment };
}

/**
 * Convert Chord objects back to text representation
 */
export function chordToText(chord: Chord): string {
  let text = chord.number;

  if (chord.beats) {
    text += '.'.repeat(chord.beats);
  }

  if (chord.accent) {
    text += '!';
  }

  return text;
}

/**
 * Convert array of chords to text
 */
export function chordsToText(chords: Chord[], comment?: string): string {
  const chordText = chords.map(chordToText).join(' ');
  if (comment) {
    return `${chordText} //${comment}`;
  }
  return chordText;
}
