import { Chord, Section, Measure, SongMetadata, NavigationMarker } from '../types/song';

export interface ParsedLine {
  type: 'section' | 'measures' | 'empty' | 'metadata';
  content: string;
  sectionName?: string;
  measures?: Measure[];
}

export interface ParseResult {
  sections: Section[];
  metadata?: Partial<SongMetadata>;
}

/**
 * Try to parse a line as a navigation marker
 * Returns NavigationMarker if successful, null otherwise
 */
function parseNavigationMarker(line: string): NavigationMarker | null {
  const trimmed = line.trim();

  // Check for exact matches (case-insensitive)
  const upper = trimmed.toUpperCase();

  // Symbol markers
  if (trimmed === '§' || upper === 'SEGNO') {
    return { type: 'segno' };
  }
  if (trimmed === '⊕' || upper === 'CODA') {
    return { type: 'coda' };
  }

  // Text markers
  if (upper === 'D.S.' || upper === 'DS') {
    return { type: 'ds' };
  }
  if (upper === 'D.S. AL FINE' || upper === 'DS AL FINE') {
    return { type: 'ds-al-fine' };
  }
  if (upper === 'D.S. AL CODA' || upper === 'DS AL CODA') {
    return { type: 'ds-al-coda' };
  }
  if (upper === 'D.C.' || upper === 'DC') {
    return { type: 'dc' };
  }
  if (upper === 'D.C. AL FINE' || upper === 'DC AL FINE') {
    return { type: 'dc-al-fine' };
  }
  if (upper === 'D.C. AL CODA' || upper === 'DC AL CODA') {
    return { type: 'dc-al-coda' };
  }
  if (upper === 'FINE') {
    return { type: 'fine' };
  }
  if (upper === 'TO CODA' || upper === 'TO ⊕') {
    return { type: 'to-coda' };
  }

  return null;
}

/**
 * Parse a complete ChordText document into sections and metadata
 */
export function parseChordText(text: string, nashvilleMode: boolean): Section[] {
  const result = parseChordTextWithMetadata(text, nashvilleMode);
  return result.sections;
}

/**
 * Parse a complete ChordText document into sections and metadata
 */
export function parseChordTextWithMetadata(text: string, nashvilleMode: boolean): ParseResult {
  const lines = text.split('\n');
  const sections: Section[] = [];
  const metadata: Partial<SongMetadata> = {
    customProperties: {},
  };
  let currentSection: Section | null = null;
  let inMultiLineComment = false;
  let multiLineCommentText = '';

  lines.forEach((line, lineIndex) => {
    let trimmed = line.trim();

    // Handle multi-line comments - collect text and display as comment
    if (trimmed.startsWith('/*')) {
      inMultiLineComment = true;
      let commentContent = trimmed.substring(2); // Remove /*
      if (commentContent.includes('*/')) {
        // Single line multi-line comment
        commentContent = commentContent.substring(0, commentContent.indexOf('*/')).trim();
        if (commentContent) {
          multiLineCommentText = commentContent;
        }
        inMultiLineComment = false;

        // Add as comment measure to current section
        if (currentSection) {
          const commentMeasure: Measure = {
            id: `measure-comment-${Date.now()}-${lineIndex}`,
            chords: [],
            rawText: '',
            comment: multiLineCommentText,
          };
          currentSection.measures.push(commentMeasure);
          currentSection.measureLines?.push({
            id: `line-comment-${Date.now()}-${lineIndex}`,
            measures: [commentMeasure],
          });
        }
        multiLineCommentText = '';
      } else {
        multiLineCommentText = commentContent.trim();
      }
      return;
    }
    if (inMultiLineComment) {
      if (trimmed.includes('*/')) {
        // End of multi-line comment
        const commentContent = trimmed.substring(0, trimmed.indexOf('*/')).trim();
        if (commentContent) {
          multiLineCommentText += (multiLineCommentText ? ' ' : '') + commentContent;
        }
        inMultiLineComment = false;

        // Add as comment measure to current section
        if (currentSection && multiLineCommentText) {
          const commentMeasure: Measure = {
            id: `measure-comment-${Date.now()}-${lineIndex}`,
            chords: [],
            rawText: '',
            comment: multiLineCommentText,
          };
          currentSection.measures.push(commentMeasure);
          currentSection.measureLines?.push({
            id: `line-comment-${Date.now()}-${lineIndex}`,
            measures: [commentMeasure],
          });
        }
        multiLineCommentText = '';
      } else {
        // Continue collecting comment text
        multiLineCommentText += (multiLineCommentText ? ' ' : '') + trimmed;
      }
      return;
    }

    // Empty line
    if (!trimmed) {
      return;
    }

    // Handle standalone // comments
    if (trimmed.startsWith('//')) {
      const commentText = trimmed.substring(2).trim();
      if (currentSection && commentText) {
        const commentMeasure: Measure = {
          id: `measure-comment-${Date.now()}-${lineIndex}`,
          chords: [],
          rawText: '',
          comment: commentText,
        };
        currentSection.measures.push(commentMeasure);
        currentSection.measureLines?.push({
          id: `line-comment-${Date.now()}-${lineIndex}`,
          measures: [commentMeasure],
        });
      }
      return;
    }

    // Parse metadata (Title:, Key:, Tempo:, etc.)
    if (trimmed.includes(':') && !trimmed.endsWith(':')) {
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (key === 'Title') {
        metadata.title = value;
        return;
      } else if (key === 'Key') {
        metadata.key = value;
        return;
      } else if (key === 'Tempo') {
        const tempoMatch = value.match(/(\d+)/);
        if (tempoMatch) {
          metadata.tempo = parseInt(tempoMatch[1], 10);
        }
        return;
      } else if (key === 'Meter') {
        metadata.timeSignature = value;
        return;
      } else if (key === 'Style') {
        metadata.style = value;
        return;
      } else if (key === 'Feel') {
        metadata.feel = value;
        return;
      } else if (key.startsWith('$')) {
        // Custom property (e.g., $Artist:, $Arranger:)
        metadata.customProperties = metadata.customProperties || {};
        metadata.customProperties[key.substring(1)] = value;
        return;
      }
    }

    // Section header (e.g., "V1:", "CHORUS:", "BR:")
    if (trimmed.endsWith(':')) {
      const sectionName = trimmed.slice(0, -1);
      currentSection = {
        id: `section-${Date.now()}-${lineIndex}`,
        name: sectionName,
        measures: [],
        measureLines: [],
      };
      sections.push(currentSection);
      return;
    }

    // Measure line (contains chords)
    if (currentSection) {
      const { measures, isRepeat, repeatMultiplier } = parseMeasureLine(trimmed, nashvilleMode);
      currentSection.measures.push(...measures);

      // Store as a measure line (keep measures from same input line together)
      currentSection.measureLines = currentSection.measureLines || [];
      currentSection.measureLines.push({
        id: `line-${Date.now()}-${lineIndex}`,
        measures,
        isRepeat,
        repeatMultiplier,
      });
    } else {
      // Create default section if none exists
      currentSection = {
        id: `section-${Date.now()}-${lineIndex}`,
        name: 'Section',
        measures: [],
        measureLines: [],
      };
      sections.push(currentSection);
      const { measures, isRepeat, repeatMultiplier } = parseMeasureLine(trimmed, nashvilleMode);
      currentSection.measures.push(...measures);
      currentSection.measureLines?.push({
        id: `line-${Date.now()}-${lineIndex}`,
        measures,
        isRepeat,
        repeatMultiplier,
      });
    }
  });

  return {
    sections: sections.length > 0 ? sections : [
      {
        id: 'section-default',
        name: 'Section 1',
        measures: [{
          id: 'measure-default',
          chords: [],
          rawText: '',
        }],
        measureLines: [],
      },
    ],
    metadata,
  };
}

/**
 * Parse a line of measures
 * Each line can contain multiple measures separated by | or split bar tokens
 * Returns measures along with repeat information
 */
function parseMeasureLine(line: string, nashvilleMode: boolean): {
  measures: Measure[];
  isRepeat?: boolean;
  repeatMultiplier?: number;
} {
  // Check if this line is a navigation marker
  const navMarker = parseNavigationMarker(line);
  if (navMarker) {
    return {
      measures: [{
        id: `measure-nav-${Date.now()}`,
        chords: [],
        rawText: line,
        navigationMarker: navMarker,
      }],
    };
  }

  // Check for repeat notation: ||: :|| or ||: :||{4}
  const repeatMatch = line.match(/^\|\|:\s*(.*?)\s*:\|\|(\{(\d+)\})?$/);
  if (repeatMatch) {
    const content = repeatMatch[1];
    const multiplier = repeatMatch[3] ? parseInt(repeatMatch[3], 10) : undefined;
    const measures = parseMeasureTokensFromLine(content, nashvilleMode);
    return {
      measures,
      isRepeat: true,
      repeatMultiplier: multiplier,
    };
  }

  // Split by explicit pipes if they exist (but not repeat bars)
  if (line.includes('|') && !line.includes('||:') && !line.includes(':||')) {
    const measureTexts = line.split('|').map(t => t.trim()).filter(t => t);
    const measures: Measure[] = [];

    measureTexts.forEach((measureText, idx) => {
      // Each pipe-separated part might still contain split bars
      const parsedMeasures = parseMeasureTokens(measureText, nashvilleMode);

      // Mark measures after first group to show pipe before them
      parsedMeasures.forEach((measure, subIdx) => {
        if (idx > 0 && subIdx === 0) {
          measure.showPipeBefore = true;
        }
        measures.push(measure);
      });
    });

    return { measures };
  }

  // Parse tokens and group into measures
  return { measures: parseMeasureTokens(line, nashvilleMode) };
}

/**
 * Parse measure tokens from a line (helper for repeat content)
 */
function parseMeasureTokensFromLine(line: string, nashvilleMode: boolean): Measure[] {
  if (line.includes('|')) {
    const measureTexts = line.split('|').map(t => t.trim()).filter(t => t);
    const measures: Measure[] = [];

    measureTexts.forEach((measureText, idx) => {
      const parsedMeasures = parseMeasureTokens(measureText, nashvilleMode);
      parsedMeasures.forEach((measure, subIdx) => {
        if (idx > 0 && subIdx === 0) {
          measure.showPipeBefore = true;
        }
        measures.push(measure);
      });
    });

    return measures;
  }

  return parseMeasureTokens(line, nashvilleMode);
}

/**
 * Smart tokenizer that respects parentheses and brackets
 * Splits on whitespace but keeps content inside () and [] together
 */
function smartTokenize(text: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let depth = 0;
  let inParens = false;
  let inBrackets = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '(' && !inBrackets) {
      inParens = true;
      depth++;
      current += char;
    } else if (char === ')' && inParens && !inBrackets) {
      depth--;
      if (depth === 0) inParens = false;
      current += char;
    } else if (char === '[' && !inParens) {
      inBrackets = true;
      depth++;
      current += char;
    } else if (char === ']' && inBrackets && !inParens) {
      depth--;
      if (depth === 0) inBrackets = false;
      current += char;
    } else if (/\s/.test(char) && depth === 0) {
      // Space outside parentheses/brackets - split here
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }

  // Add last token
  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens;
}

/**
 * Parse tokens into measures, treating split bars as separate measures
 */
function parseMeasureTokens(text: string, nashvilleMode: boolean): Measure[] {
  if (!text.trim()) return [];

  // Extract comment if exists (handle both // and /* */)
  let chordText = text;
  let comment: string | undefined;

  // Handle // comments
  const commentIndex = text.indexOf('//');
  if (commentIndex !== -1) {
    chordText = text.substring(0, commentIndex).trim();
    comment = text.substring(commentIndex + 2).trim();
  }

  // Handle inline /* */ comments - remove them from chordText but keep for display
  const inlineCommentRegex = /\/\*[^*]*\*\//g;
  const inlineComments = chordText.match(inlineCommentRegex);
  if (inlineComments) {
    chordText = chordText.replace(inlineCommentRegex, '').trim();
  }

  const tokens = smartTokenize(chordText);
  const measures: Measure[] = [];
  let currentMeasureTokens: string[] = [];
  let currentMeterChange: string | undefined;

  tokens.forEach((token, index) => {
    // Check for inline meter change: [3/8]
    const meterMatch = token.match(/^\[(\d+\/\d+)\]$/);
    if (meterMatch) {
      currentMeterChange = meterMatch[1];
      return;
    }

    // Check for multi-measure repeat: %%, %%%, etc (2 or more %)
    // Single % is treated as a chord (repeat last chord)
    const repeatMatch = token.match(/^(%{2,})$/);
    if (repeatMatch) {
      const repeatCount = repeatMatch[1].length;
      measures.push({
        id: `measure-${Date.now()}-${index}-repeat`,
        chords: [],
        rawText: token,
        isSplitBar: false,
        isRepeat: true,
        repeatCount: repeatCount,
        meterChange: currentMeterChange,
      });
      currentMeterChange = undefined;
      return;
    }

    // If this is a split bar token, it becomes its own measure
    if (isSplitBarToken(token)) {
      // First, flush any accumulated non-split-bar chords
      if (currentMeasureTokens.length > 0) {
        const measureText = currentMeasureTokens.join(' ');
        const { chords, isSplitBar } = parseChords(measureText, nashvilleMode);
        measures.push({
          id: `measure-${Date.now()}-${index}`,
          chords,
          rawText: measureText,
          isSplitBar,
          meterChange: currentMeterChange,
        });
        currentMeasureTokens = [];
        currentMeterChange = undefined;
      }

      // Then add the split bar as its own measure
      const { chords, isSplitBar } = parseChords(token, nashvilleMode);
      measures.push({
        id: `measure-${Date.now()}-${index}-split`,
        chords,
        rawText: token,
        isSplitBar,
        meterChange: currentMeterChange,
      });
      currentMeterChange = undefined;
    } else {
      // Regular chord - accumulate for current measure
      currentMeasureTokens.push(token);
    }
  });

  // Flush any remaining tokens
  if (currentMeasureTokens.length > 0) {
    const measureText = currentMeasureTokens.join(' ');
    const { chords, isSplitBar } = parseChords(measureText, nashvilleMode);
    measures.push({
      id: `measure-${Date.now()}-final`,
      chords,
      rawText: measureText,
      isSplitBar,
      meterChange: currentMeterChange,
    });
  }

  // Add comment to the last measure if comment exists
  if (comment && measures.length > 0) {
    measures[measures.length - 1].comment = comment;
  }

  return measures.length > 0 ? measures : [{
    id: `measure-${Date.now()}`,
    chords: [],
    rawText: '',
    isSplitBar: false,
  }];
}

/**
 * Check if a token is a split bar (tie)
 * Parentheses create ties with parentheses
 * Underscores create ties with underline styling
 */
function isSplitBarToken(token: string): boolean {
  // Check if it's an ending with split bar inside: e.g., 2[(1 2 3)]
  const endingMatch = token.match(/^\d+\[(.*)\]$/);
  if (endingMatch) {
    const inner = endingMatch[1].trim();
    // Check if inner content is a tie (parentheses or underscore)
    return (inner.startsWith('(') && inner.endsWith(')')) || inner.includes('_');
  }

  return (token.startsWith('(') && token.endsWith(')')) ||
         (token.startsWith('[') && token.endsWith(']')) ||
         token.includes('_');
}

/**
 * Parse chords from a measure text
 * Returns {chords, isSplitBar} to indicate if any split bars were found
 */
function parseChords(text: string, nashvilleMode: boolean): { chords: Chord[]; isSplitBar: boolean } {
  if (!text.trim()) return { chords: [], isSplitBar: false };

  const chords: Chord[] = [];
  let isSplitBar = false;
  let parenthesesGroupCounter = 0;

  const tokens = smartTokenize(text);

  tokens.forEach((token, index) => {
    if (!token) return;

    // Skip comments
    if (token.startsWith('//')) return;

    // Check for split bars and expand them
    const { chords: expandedChords, wasSplitBar } = expandSplitBar(token, nashvilleMode, parenthesesGroupCounter);
    if (wasSplitBar) {
      isSplitBar = true;
      // Increment counter for next parentheses group
      parenthesesGroupCounter++;
    }

    expandedChords.forEach((chord, subIndex) => {
      chord.id = `chord-${Date.now()}-${index}-${subIndex}`;
      chords.push(chord);
    });
  });

  return { chords, isSplitBar };
}

/**
 * Parse the first chord from a string and return the chord and remaining text
 * Example: "54" -> { chord: "5", remaining: "4" }
 * Example: "6-4" -> { chord: "6-", remaining: "4" }
 */
function parseFirstChord(text: string, nashvilleMode: boolean): { chord: Chord | null; remaining: string } {
  if (!text) return { chord: null, remaining: '' };

  // Try to match a complete chord at the start
  let i = 0;

  // Check for accidental at start (#, b)
  if (text[i] === '#' || text[i] === 'b') i++;

  // Must have a number
  if (i >= text.length || !/\d/.test(text[i])) {
    return { chord: null, remaining: text };
  }
  i++; // Consume the digit

  // Check for quality markers (-, +, o, ^, M, m)
  while (i < text.length && /[-+o^Mm]/.test(text[i])) i++;

  // Check for extensions (sus4, add9, D7, **7, **^7, etc.)
  if (i < text.length) {
    // Check for 'sus'
    if (text.slice(i).startsWith('sus')) {
      i += 3;
      while (i < text.length && /\d/.test(text[i])) i++;
    }
    // Check for 'add'
    else if (text.slice(i).startsWith('add')) {
      i += 3;
      while (i < text.length && /\d/.test(text[i])) i++;
    }
    // Check for 'D' (dominant)
    else if (text[i] === 'D') {
      i++;
      while (i < text.length && /\d/.test(text[i])) i++;
    }
    // Check for '**' (extended chords)
    else if (text.slice(i).startsWith('**')) {
      i += 2;
      if (i < text.length && /[\^M]/.test(text[i])) i++;
      while (i < text.length && /\d/.test(text[i])) i++;
    }
  }

  // Check for slash chord (inversion)
  if (i < text.length && text[i] === '/') {
    i++;
    if (i < text.length && (text[i] === '#' || text[i] === 'b')) i++;
    while (i < text.length && /\d/.test(text[i])) i++;
  }

  const chordText = text.slice(0, i);
  const remaining = text.slice(i);

  const chord = parseChordToken(chordText, nashvilleMode);
  return { chord, remaining };
}

/**
 * Parse the next complete chord token with all modifiers from a string
 * Handles dots, note values, walk indicators, etc.
 * Example: "1.@wd" -> { chord: Chord, remaining: "" }
 * Example: "1.2q" -> { chord: Chord(1 with dot), remaining: "2q" }
 */
function parseNextCompleteChord(text: string, nashvilleMode: boolean): { chord: Chord | null; remaining: string } {
  if (!text) return { chord: null, remaining: '' };

  let i = 0;

  // Check for diamond notation <chord>
  if (text[i] === '<') {
    i++;
    // Find the closing >
    while (i < text.length && text[i] !== '>') i++;
    if (i < text.length) i++; // Include the closing >

    // Check for additional modifiers after diamond
    // Modulation (mod+/-N)
    if (text.slice(i).startsWith('mod')) {
      const modMatch = text.slice(i).match(/^mod([+-]\d+)/);
      if (modMatch) {
        i += modMatch[0].length;
      }
    }

    // Walk indicators
    if (text.slice(i).startsWith('@walkdown') || text.slice(i).startsWith('@wd')) {
      i += text.slice(i).startsWith('@walkdown') ? 9 : 3;
    } else if (text.slice(i).startsWith('@walkup') || text.slice(i).startsWith('@wu')) {
      i += text.slice(i).startsWith('@walkup') ? 7 : 3;
    }

    // Dots
    while (i < text.length && text[i] === '.') i++;

    // Note value
    if (i < text.length && /[whqest]/.test(text[i])) i++;

    // Push symbols after diamond - only check for > (push late) or < if followed by non-digit
    // Don't consume < if it might be the start of another diamond chord
    if (i < text.length && text[i] === '>') {
      i++;
    } else if (i < text.length && text[i] === '<' && (i + 1 >= text.length || !/\d/.test(text[i + 1]))) {
      // Only consume < if next char is not a digit OR we're at the end (meaning it's push, not a new diamond)
      i++;
    }

    const chordText = text.slice(0, i);
    const remaining = text.slice(i);
    const chord = parseChordToken(chordText, nashvilleMode);
    return { chord, remaining };
  }

  // Check for letter chords (A-H) or rest chord (X) - handle separately because parseFirstChord expects digits
  // Can start with accidental before letter (bA, #F) or letter first (A#, Bb)
  let startsWithAccidental = false;
  if ((text[0] === '#' || text[0] === 'b') && text.length > 1 && /[A-HX]/.test(text[1].toUpperCase())) {
    // Accidental before letter: bA, #F
    startsWithAccidental = true;
    i = 2; // Skip both accidental and letter
  } else if (/[A-HX]/.test(text[0].toUpperCase())) {
    // Letter first: A, F, X
    i = 1;
    // Check for accidental after letter (e.g., A#, Bb)
    if (i < text.length && (text[i] === '#' || text[i] === 'b')) i++;
  }

  if (startsWithAccidental || /[A-HX]/.test(text[0].toUpperCase())) {

    // Check for quality markers (-, +, o, ^, M, m)
    while (i < text.length && /[-+o^Mm]/.test(text[i])) i++;

    // Check for extensions (sus4, add9, 7, 9, 11, 13, etc.)
    if (i < text.length) {
      // Check for 'sus'
      if (text.slice(i).startsWith('sus')) {
        i += 3;
        while (i < text.length && /\d/.test(text[i])) i++;
      }
      // Check for 'add'
      else if (text.slice(i).startsWith('add')) {
        i += 3;
        while (i < text.length && /\d/.test(text[i])) i++;
      }
      // Check for numeric extensions (7, 9, 11, 13)
      else if (/\d/.test(text[i])) {
        while (i < text.length && /\d/.test(text[i])) i++;
      }
    }

    // Check for slash chord (inversion)
    if (i < text.length && text[i] === '/') {
      i++;
      if (i < text.length && (text[i] === '#' || text[i] === 'b')) i++;
      if (i < text.length && /[A-H]/.test(text[i].toUpperCase())) i++;
    }

    // Now parse modifiers that come after the base chord
    // Walk indicators
    if (text.slice(i).startsWith('@walkdown') || text.slice(i).startsWith('@wd')) {
      i += text.slice(i).startsWith('@walkdown') ? 9 : 3;
    } else if (text.slice(i).startsWith('@walkup') || text.slice(i).startsWith('@wu')) {
      i += text.slice(i).startsWith('@walkup') ? 7 : 3;
    }

    // Dots (beat marks)
    while (i < text.length && text[i] === '.') i++;

    // Note value (w, h, q, e, s, t)
    if (i < text.length && /[whqest]/.test(text[i])) i++;

    // Accent
    if (i < text.length && text[i] === '!') i++;

    // Push symbols - but don't consume < if it starts a diamond chord
    if (i < text.length && text[i] === '>') {
      i++;
    } else if (i < text.length && text[i] === '<' && (i + 1 >= text.length || !/[\dA-HX]/.test(text[i + 1].toUpperCase()))) {
      // Only consume < if it's the last character OR next char is not a digit or letter (meaning it's push, not a new diamond/chord)
      i++;
    }

    // Tie
    if (i < text.length && text[i] === '=') i++;

    // Fermata
    if (i < text.length && text[i] === '~') i++;

    const chordText = text.slice(0, i);
    const remaining = text.slice(i);
    const chord = parseChordToken(chordText, nashvilleMode);
    return { chord, remaining };
  }

  // Regular chord - parse base chord number first
  const { chord: baseChord, remaining: afterBase } = parseFirstChord(text, nashvilleMode);
  if (!baseChord) return { chord: null, remaining: text };

  // Now check for modifiers that come after the base chord
  i = text.length - afterBase.length;

  // Walk indicators
  if (text.slice(i).startsWith('@walkdown') || text.slice(i).startsWith('@wd')) {
    i += text.slice(i).startsWith('@walkdown') ? 9 : 3;
  } else if (text.slice(i).startsWith('@walkup') || text.slice(i).startsWith('@wu')) {
    i += text.slice(i).startsWith('@walkup') ? 7 : 3;
  }

  // Dots (beat marks)
  while (i < text.length && text[i] === '.') i++;

  // Note value (w, h, q, e, s, t)
  if (i < text.length && /[whqest]/.test(text[i])) i++;

  // Accent
  if (i < text.length && text[i] === '!') i++;

  // Push symbols - but don't consume < if it starts a diamond chord
  if (i < text.length && text[i] === '>') {
    i++;
  } else if (i < text.length && text[i] === '<' && (i + 1 >= text.length || !/[\dA-HX]/.test(text[i + 1].toUpperCase()))) {
    // Only consume < if it's the last character OR next char is not a digit or letter (meaning it's push, not a new diamond/chord)
    i++;
  }

  // Tie
  if (i < text.length && text[i] === '=') i++;

  // Fermata
  if (i < text.length && text[i] === '~') i++;

  // Parse the complete token
  const chordText = text.slice(0, i);
  const remaining = text.slice(i);
  const chord = parseChordToken(chordText, nashvilleMode);
  return { chord, remaining };
}

/**
 * Expand tie/split bar notation into multiple chords
 * Examples: "(1 4)" -> [1, 4], "(1144)" -> [1, 1, 4, 4], "[1234]" -> [1, 2, 3, 4]
 * Also handles endings: "1[2 4 5]" -> [2, 4, 5] with ending=1
 * Returns {chords, wasSplitBar} to indicate if this was a tie
 */
function expandSplitBar(token: string, nashvilleMode: boolean, parenthesesGroupId: number = 0): { chords: Chord[]; wasSplitBar: boolean } {
  // Handle endings: 1[2 4 5], 2[1 1 1], 2[(1 2 3)], etc.
  const endingMatch = token.match(/^(\d+)\[(.*)\]$/);
  if (endingMatch) {
    const endingNumber = parseInt(endingMatch[1], 10);
    const inner = endingMatch[2].trim();

    // Parse the inner content, which could include ties and complex tokens
    const { chords } = parseChords(inner, nashvilleMode);

    // Add ending number only to the first chord
    if (chords.length > 0) {
      chords[0].ending = endingNumber;
    }

    // Don't propagate isSplitBar for endings - individual chords have inParentheses flag
    return { chords, wasSplitBar: false };
  }

  // Handle parenthesized ties: (1 4) or (1144) or (1.x..<1><mod+2>)
  if (token.startsWith('(') && token.endsWith(')')) {
    const inner = token.slice(1, -1).trim();
    const chords: Chord[] = [];

    // Always use parseNextCompleteChord to handle complex syntax with dots, diamonds, etc.
    let remaining = inner;
    while (remaining.length > 0) {
      // Skip whitespace
      if (/^\s/.test(remaining)) {
        remaining = remaining.substring(1);
        continue;
      }

      // Check for modulation annotation <mod+/-N>
      const modMatch = remaining.match(/^<mod([+-]\d+)>/);
      if (modMatch) {
        // Apply modulation to the previous chord
        if (chords.length > 0) {
          const sign = modMatch[1][0] === '+' ? 1 : -1;
          const value = parseInt(modMatch[1].substring(1), 10);
          chords[chords.length - 1].modulation = sign * value;
        }
        remaining = remaining.substring(modMatch[0].length);
        continue;
      }

      // Try to parse a complete chord token with all modifiers
      const result = parseNextCompleteChord(remaining, nashvilleMode);
      if (result.chord) {
        // Mark chord as being inside parentheses with unique group ID
        result.chord.inParentheses = true;
        result.chord.parenthesesGroupId = parenthesesGroupId;
        chords.push(result.chord);
        remaining = result.remaining;
      } else {
        // Skip this character if we can't parse it
        remaining = remaining.substring(1);
      }
    }

    return { chords, wasSplitBar: true };
  }

  // Handle bracket split bars: [1 2 4] or [1234]
  if (token.startsWith('[') && token.endsWith(']')) {
    const inner = token.slice(1, -1);
    const parts = inner.includes(' ') ? inner.split(/\s+/) : inner.split('');
    const chords = parts.map(part => parseChordToken(part, nashvilleMode)).filter(c => c !== null) as Chord[];
    return { chords, wasSplitBar: true };
  }

  // Handle underscore ties: 5..._1. or 1_2_3
  // These create underlined chords (no visual parentheses)
  if (token.includes('_')) {
    console.log('[expandSplitBar] Underscore tie:', token);
    const parts = token.split('_').filter(p => p.trim()); // Filter out empty parts
    console.log('[expandSplitBar] Underscore parts:', parts);
    const chords = parts.map(part => {
      const chord = parseChordToken(part.trim(), nashvilleMode);
      console.log('[expandSplitBar] Parsed underscore part:', { part, chord });
      if (chord) {
        // Add underscore to number to trigger underline rendering
        chord.number = chord.number + '_';
      }
      return chord;
    }).filter(c => c !== null) as Chord[];
    console.log('[expandSplitBar] Final underscore chords:', chords);
    return { chords, wasSplitBar: true };
  }

  // Regular single chord
  const chord = parseChordToken(token, nashvilleMode);
  return { chords: chord ? [chord] : [], wasSplitBar: false };
}

/**
 * Parse a single chord token with all its modifiers
 * Examples: "1", "4!", "5<", "<1>", "#5", "b7", "X", "1=", "1~", "1/⁎comment⁎/", "%", etc.
 */
function parseChordToken(token: string, nashvilleMode: boolean): Chord | null {
  // Handle separator (*)
  if (token === '*') {
    return {
      id: '',
      number: '*',
      nashvilleMode,
    };
  }

  // Handle repeat symbol (%)
  if (token === '%') {
    return {
      id: '',
      number: '%',
      nashvilleMode,
    };
  }

  let workingToken = token;
  let accent = false;
  let beats = 0;
  let push: 'early' | 'late' | undefined = undefined;
  let diamond = false;
  let noteValue: 'w' | 'h' | 'q' | 'e' | 's' | 't' | undefined = undefined;
  let walk: 'down' | 'up' | undefined = undefined;
  let modulation: number | undefined = undefined;
  let tie = false;
  let fermata = false;
  let inlineComment: string | undefined = undefined;

  // Extract inline comment: 1/*text*/
  const inlineCommentMatch = workingToken.match(/\/\*([^*]*)\*\//);
  if (inlineCommentMatch) {
    inlineComment = inlineCommentMatch[1].trim();
    workingToken = workingToken.replace(/\/\*[^*]*\*\//, '');
  }

  // Check for modulation (mod+1, mod-2, etc.)
  const modMatch = workingToken.match(/mod([+-])(\d+)/);
  if (modMatch) {
    const sign = modMatch[1] === '+' ? 1 : -1;
    modulation = sign * parseInt(modMatch[2], 10);
    workingToken = workingToken.replace(/mod[+-]\d+/g, '');
  }

  // Check for walk down (@wd/@walkdown) or walk up (@wu/@walkup)
  if (workingToken.includes('@walkdown') || workingToken.includes('@wd')) {
    walk = 'down';
    workingToken = workingToken.replace(/@walkdown|@wd/g, '');
  } else if (workingToken.includes('@walkup') || workingToken.includes('@wu')) {
    walk = 'up';
    workingToken = workingToken.replace(/@walkup|@wu/g, '');
  }

  // Check for diamond notation <chord> (e.g., <1> or <1><)
  const diamondMatch = workingToken.match(/^<([^>]+)>/);
  if (diamondMatch) {
    diamond = true;
    // Remove only the diamond wrapper, keep everything after (like push symbols)
    workingToken = diamondMatch[1] + workingToken.substring(diamondMatch[0].length);
  }

  // Check for tie (=)
  if (workingToken.endsWith('=')) {
    tie = true;
    workingToken = workingToken.slice(0, -1);
  }

  // Check for fermata (~)
  if (workingToken.endsWith('~')) {
    fermata = true;
    workingToken = workingToken.slice(0, -1);
  }

  // Check for accent/mute !
  if (workingToken.includes('!')) {
    accent = true;
    workingToken = workingToken.replace(/!/g, '');
  }

  // Check for push < or > (can be combined with diamond)
  if (workingToken.endsWith('<')) {
    push = 'early';
    workingToken = workingToken.slice(0, -1);
  } else if (workingToken.endsWith('>')) {
    push = 'late';
    workingToken = workingToken.slice(0, -1);
  }

  // Check for note value suffix (w, h, q, e, s, t) - extract this BEFORE dots
  const noteValueMatch = workingToken.match(/([whqest])$/);
  if (noteValueMatch) {
    noteValue = noteValueMatch[1] as 'w' | 'h' | 'q' | 'e' | 's' | 't';
    workingToken = workingToken.slice(0, -1);
  }

  // Count tick marks (dots for beats) - extract AFTER note value
  const dotMatch = workingToken.match(/\.+$/);
  if (dotMatch) {
    beats = dotMatch[0].length;
    workingToken = workingToken.replace(/\.+$/, '');
  }

  // The rest is the chord number/name (can include accidentals like #5, b7)
  const number = workingToken.trim();

  if (!number) return null;

  // Check if this is a rest (X or x, case-insensitive)
  const isRest = number.toUpperCase() === 'X' || number.toUpperCase().startsWith('X_');

  return {
    id: '', // Will be set by caller
    number,
    nashvilleMode,
    beats: beats > 0 ? beats : undefined,
    accent: accent || undefined,
    diamond: diamond || undefined,
    push: push || undefined,
    walk: walk || undefined,
    modulation: modulation || undefined,
    tie: tie || undefined,
    fermata: fermata || undefined,
    isRest: isRest || undefined,
    inlineComment: inlineComment || undefined,
    annotation: noteValue ? { value: noteValue } : undefined,
  };
}

/**
 * Convert sections back to ChordText format
 */
export function sectionsToChordText(sections: Section[]): string {
  if (sections.length === 0) return '';

  // If first section has no measures or empty measures, return empty
  if (sections.length === 1 &&
      (!sections[0].measures.length ||
       (sections[0].measures.length === 1 &&
        sections[0].measures[0].chords.length === 0 &&
        !sections[0].measures[0].rawText))) {
    return '';
  }

  return sections.map((section) => {
    const lines: string[] = [];

    // Section header
    lines.push(`${section.name}:`);

    // Use measureLines if available to preserve line structure
    if (section.measureLines && section.measureLines.length > 0) {
      section.measureLines.forEach((line) => {
        let lineText = '';

        // Handle repeat notation
        if (line.isRepeat) {
          const measuresText = line.measures.map(m => m.rawText || chordsToText(m.chords)).join(' ');
          const multiplier = line.repeatMultiplier ? `{${line.repeatMultiplier}}` : '';
          lineText = `  ||: ${measuresText} :||${multiplier}`;
        } else {
          // Regular line - join all measures with space
          lineText = '  ' + line.measures.map((measure) => {
            let text = measure.rawText || chordsToText(measure.chords);
            if (measure.comment) {
              text = text ? `${text} //${measure.comment}` : `//${measure.comment}`;
            }
            return text;
          }).filter(t => t).join(' ');
        }

        if (lineText.trim()) {
          lines.push(lineText);
        }
      });
    } else {
      // Fallback to old format if no measureLines
      section.measures.forEach((measure) => {
        let text = measure.rawText || chordsToText(measure.chords);
        if (measure.comment) {
          text = text ? `${text} //${measure.comment}` : `//${measure.comment}`;
        }
        if (text) {
          lines.push('  ' + text);
        }
      });
    }

    return lines.join('\n');
  }).join('\n\n');
}

function chordsToText(chords: Chord[]): string {
  return chords.map(chord => {
    let text = chord.number;
    if (chord.beats) text += '.'.repeat(chord.beats);
    if (chord.accent) text += '!';
    return text;
  }).join(' ');
}
