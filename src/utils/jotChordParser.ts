import { Chord, Section, Measure, SongMetadata } from '../types/song';

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

  const tokens = chordText.trim().split(/\s+/).filter(t => t);
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

    // Check for multi-measure repeat: %, %%, %%%, etc (up to 8)
    const repeatMatch = token.match(/^(%+)$/);
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
 * Check if a token is an ending (e.g., "1[...]" or "2[...]")
 */
function isEndingToken(token: string): boolean {
  return /^\d+\[.*\]$/.test(token);
}

/**
 * Check if a token is a split bar
 */
function isSplitBarToken(token: string): boolean {
  // Exclude endings from split bars
  if (isEndingToken(token)) return false;

  return token.includes('_') ||
         (token.startsWith('(') && token.endsWith(')')) ||
         (token.startsWith('[') && token.endsWith(']'));
}

/**
 * Parse chords from a measure text
 * Returns {chords, isSplitBar} to indicate if any split bars were found
 */
function parseChords(text: string, nashvilleMode: boolean): { chords: Chord[]; isSplitBar: boolean } {
  if (!text.trim()) return { chords: [], isSplitBar: false };

  const chords: Chord[] = [];
  let isSplitBar = false;

  // Split by whitespace to get individual chord tokens
  const tokens = text.trim().split(/\s+/);

  tokens.forEach((token, index) => {
    if (!token) return;

    // Skip comments
    if (token.startsWith('//')) return;

    // Check for split bars and expand them
    const { chords: expandedChords, wasSplitBar } = expandSplitBar(token, nashvilleMode);
    if (wasSplitBar) isSplitBar = true;

    expandedChords.forEach((chord, subIndex) => {
      chord.id = `chord-${Date.now()}-${index}-${subIndex}`;
      chords.push(chord);
    });
  });

  return { chords, isSplitBar };
}

/**
 * Expand split bar notation into multiple chords
 * Examples: "1_6-" -> [1, 6-], "(1 4)" -> [1, 4], "[1234]" -> [1, 2, 3, 4]
 * Also handles endings: "1[2 4 5]" -> [2, 4, 5] with ending=1
 * Returns {chords, wasSplitBar} to indicate if this was a split bar
 */
function expandSplitBar(token: string, nashvilleMode: boolean): { chords: Chord[]; wasSplitBar: boolean } {
  // Handle endings: 1[2 4 5], 2[1 1 1], etc.
  const endingMatch = token.match(/^(\d+)\[(.*)\]$/);
  if (endingMatch) {
    const endingNumber = parseInt(endingMatch[1], 10);
    const inner = endingMatch[2].trim();
    const parts = inner.includes(' ') ? inner.split(/\s+/) : inner.split('');
    const chords = parts.map(part => parseChordToken(part, nashvilleMode)).filter(c => c !== null) as Chord[];

    // Add ending number to all chords in this ending
    chords.forEach(chord => {
      chord.ending = endingNumber;
    });

    return { chords, wasSplitBar: false };
  }

  // Handle underscore split bars: 1_6- or 4_3-_2_1
  if (token.includes('_')) {
    const parts = token.split('_').filter(p => p);
    const chords = parts.map(part => parseChordToken(part, nashvilleMode)).filter(c => c !== null) as Chord[];
    return { chords, wasSplitBar: true };
  }

  // Handle parenthesized split bars: (1 4) or (3444)
  if (token.startsWith('(') && token.endsWith(')')) {
    const inner = token.slice(1, -1);
    const parts = inner.includes(' ') ? inner.split(/\s+/) : inner.split('');
    const chords = parts.map(part => parseChordToken(part, nashvilleMode)).filter(c => c !== null) as Chord[];
    return { chords, wasSplitBar: true };
  }

  // Handle bracket split bars: [1 2 4] or [1234]
  if (token.startsWith('[') && token.endsWith(']')) {
    const inner = token.slice(1, -1);
    const parts = inner.includes(' ') ? inner.split(/\s+/) : inner.split('');
    const chords = parts.map(part => parseChordToken(part, nashvilleMode)).filter(c => c !== null) as Chord[];
    return { chords, wasSplitBar: true };
  }

  // Regular single chord
  const chord = parseChordToken(token, nashvilleMode);
  return { chords: chord ? [chord] : [], wasSplitBar: false };
}

/**
 * Parse a single chord token with all its modifiers
 * Examples: "1", "4!", "5<", "<1>", "#5", "b7", "X", "1=", "1~", "1/⁎comment⁎/", etc.
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

  // Handle no chord / rest (X)
  if (token === 'X' || token.startsWith('X_')) {
    return {
      id: '',
      number: token,
      nashvilleMode,
      isRest: true,
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

  // Count tick marks (dots for beats)
  const dotMatch = workingToken.match(/\.+$/);
  if (dotMatch) {
    beats = dotMatch[0].length;
    workingToken = workingToken.replace(/\.+$/, '');
  }

  // Check for note value suffix (w, h, q, e, s, t)
  const noteValueMatch = workingToken.match(/([whqest])$/);
  if (noteValueMatch) {
    noteValue = noteValueMatch[1] as 'w' | 'h' | 'q' | 'e' | 's' | 't';
    workingToken = workingToken.slice(0, -1);
  }

  // The rest is the chord number/name (can include accidentals like #5, b7)
  const number = workingToken.trim();

  if (!number) return null;

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

    // Measures - one per line (or use rawText if available)
    section.measures.forEach((measure) => {
      let text = measure.rawText || chordsToText(measure.chords);
      if (measure.comment) {
        text = text ? `${text} //${measure.comment}` : `//${measure.comment}`;
      }
      if (text) {
        lines.push('    ' + text);
      }
    });

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
