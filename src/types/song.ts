export type NoteValue = 'w' | 'h' | 'q' | 'e' | 's' | 't';  // w=whole, h=half, q=quarter, e=eighth, s=sixteenth, t=32nd

export interface NoteAnnotation {
  value: NoteValue;
  dotted?: boolean;
  triplet?: boolean;
}

export interface Chord {
  id: string;
  number: string; // "1", "2", "3-", "4sus4", "#5", "b7", etc.
  annotation?: NoteAnnotation; // Note value above the chord
  nashvilleMode: boolean; // true = Nashville Number, false = Chord name
  beats?: number; // Number of beats (represented by dots: 1... = 3 beats)
  accent?: boolean; // Accent mark (!)
  diamond?: boolean; // Diamond notation <1> (whole note/let ring)
  push?: 'early' | 'late'; // Push: < = early, > = late
  ending?: number; // Ending number (1[...], 2[...], etc.)
  walk?: 'down' | 'up'; // Walk down (@wd/@walkdown) or walk up (@wu/@walkup)
  modulation?: number; // Modulation in semitones (mod+1, mod-2, etc.) - can be negative
  tie?: boolean; // Tie to next chord (=)
  fermata?: boolean; // Fermata (~)
  isRest?: boolean; // No chord (X)
  inlineComment?: string; // Inline comment (1/*text*/)
}

export interface Measure {
  id: string;
  chords: Chord[];
  rawText?: string; // Raw text input for text-based editing (e.g., "1... 4! 5")
  comment?: string; // Comment text (e.g., "//detta är en kommentar")
  isSplitBar?: boolean; // Whether this measure contains multiple chords (split bar)
  showPipeBefore?: boolean; // Whether to show pipe separator before this measure
  meterChange?: string; // Inline meter change (e.g., "3/8")
  isRepeat?: boolean; // Multi-measure repeat (%, %%, etc.)
  repeatCount?: number; // Number of measures to repeat (1-8)
}

export interface MeasureLine {
  id: string;
  measures: Measure[];
  isRepeat?: boolean; // ||: :|| notation
  repeatMultiplier?: number; // ||: :||{4} - how many times to repeat
}

export interface Section {
  id: string;
  name: string; // "Verse 1", "Chorus", etc.
  measures: Measure[];
  measureLines?: MeasureLine[]; // Group measures by input line
  comment?: string; // Section-level comment
}

export interface SongMetadata {
  title: string;
  key: string; // "C", "G", "Bb", "F#", etc.
  tempo?: number; // Optional tempo in BPM
  timeSignature?: string; // "4/4", "3/4", "6/8", etc. (defaults to 4/4)
  style?: string; // Style description (e.g., "Bossa nova", "WB")
  feel?: string; // Feel description (e.g., "Swing")
  customProperties?: Record<string, string>; // Custom $properties (e.g., $Artist, $Arranger)
}

export interface Song {
  id: string;
  metadata: SongMetadata;
  sections: Section[];
  createdAt: Date;
  updatedAt: Date;
}

// Key signatures for chord conversion
export const KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'] as const;
export type Key = typeof KEYS[number];

// Nashville Number to Chord mapping
export const SCALE_DEGREES: Record<number, string[]> = {
  1: ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'],
  2: ['D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'C', 'C#', 'Db'],
  3: ['E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'C', 'C#', 'Db', 'D', 'D#', 'Eb'],
  4: ['F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E'],
  5: ['G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb'],
  6: ['A', 'A#', 'Bb', 'B', 'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab'],
  7: ['B', 'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb'],
};
