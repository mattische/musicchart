import { Song, MeasureLine } from '../types/song';
import ChordDisplay from './ChordDisplay';
import NavigationMarkerDisplay from './NavigationMarkerDisplay';

interface ChordTextOutputProps {
  song: Song;
  nashvilleMode: boolean;
  twoColumnLayout?: boolean;
  fitToPage?: boolean;
  fontSize?: string;
  alignment?: string;
}

const getFontSizeClass = (size: string) => {
  switch (size) {
    case 'xs': return 'text-xs';
    case 'tiny': return 'text-sm';
    case 'small': return 'text-base';
    case 'normal': return 'text-2xl';           // 24px (1.5rem)
    case 'medium': return 'text-[3rem]';        // 48px - 2x normal
    case 'big': return 'text-[4.5rem]';         // 72px - 3x normal
    case 'huge': return 'text-[6rem]';          // 96px - 4x normal
    case 'giant': return 'text-[8rem]';         // 128px - 5.3x normal
    case 'massive': return 'text-[10rem]';      // 160px - 6.7x normal
    case 'colossal': return 'text-[13rem]';     // 208px - 8.7x normal
    case 'enormous': return 'text-[16rem]';     // 256px - 10.7x normal
    case 'gigantic': return 'text-[20rem]';     // 320px - 13.3x normal - MEGA!
    default: return 'text-2xl';
  }
};

// Section name size - smaller than chords but still scales significantly
const getSectionFontSizeClass = (size: string) => {
  switch (size) {
    case 'xs': return 'text-xs';
    case 'tiny': return 'text-sm';
    case 'small': return 'text-base';
    case 'normal': return 'text-lg';
    case 'medium': return 'text-2xl';
    case 'big': return 'text-4xl';
    case 'huge': return 'text-5xl';
    case 'giant': return 'text-6xl';
    case 'massive': return 'text-7xl';
    case 'colossal': return 'text-8xl';
    case 'enormous': return 'text-9xl';
    case 'gigantic': return 'text-[10rem]';  // Very large but still smaller than chords
    default: return 'text-lg';
  }
};

// Comment size - smaller than chords and sections but still scales
const getCommentFontSizeClass = (size: string) => {
  switch (size) {
    case 'xs': return 'text-xs';
    case 'tiny': return 'text-xs';
    case 'small': return 'text-sm';
    case 'normal': return 'text-sm';
    case 'medium': return 'text-base';
    case 'big': return 'text-xl';
    case 'huge': return 'text-2xl';
    case 'giant': return 'text-3xl';
    case 'massive': return 'text-4xl';
    case 'colossal': return 'text-5xl';
    case 'enormous': return 'text-6xl';
    case 'gigantic': return 'text-7xl';  // Large but smaller than sections
    default: return 'text-sm';
  }
};

// Helper to check if a chord is a "real" chord (not separator or repeat symbol)
const isRealChord = (chord: any): boolean => {
  if (!chord || !chord.number) return false;
  // Separators and repeat symbols are not real chords
  return chord.number !== '*' && chord.number !== '%';
};

// Helper to group chords into chunks based on inParentheses flag and parenthesesGroupId
// Returns an array of chunks, where each chunk has chords and a needsParentheses flag
const groupChordsByParentheses = (chords: any[]): Array<{ chords: any[]; needsParentheses: boolean }> => {
  const chunks: Array<{ chords: any[]; needsParentheses: boolean }> = [];
  let currentChunk: any[] = [];
  let currentNeedsParentheses = false;
  let currentGroupId: number | undefined = undefined;

  chords.forEach((chord, index) => {
    const chordNeedsParentheses = chord.inParentheses === true;
    const chordGroupId = chord.parenthesesGroupId;

    // Start a new chunk if:
    // 1. Parentheses status changed, OR
    // 2. Group ID changed (different parentheses group)
    if (index > 0 && (
      chordNeedsParentheses !== currentNeedsParentheses ||
      (chordNeedsParentheses && chordGroupId !== currentGroupId)
    )) {
      if (currentChunk.length > 0) {
        chunks.push({ chords: currentChunk, needsParentheses: currentNeedsParentheses });
        currentChunk = [];
      }
    }

    currentNeedsParentheses = chordNeedsParentheses;
    currentGroupId = chordGroupId;
    currentChunk.push(chord);
  });

  // Add the last chunk
  if (currentChunk.length > 0) {
    chunks.push({ chords: currentChunk, needsParentheses: currentNeedsParentheses });
  }

  return chunks;
};

// Split measure lines into chunks of 4 real chords for two column mode
const splitMeasureLinesForTwoColumn = (
  measureLines: MeasureLine[],
  twoColumnMode: boolean
): MeasureLine[] => {
  if (!twoColumnMode) {
    return measureLines; // Don't split in single column mode
  }

  const result: MeasureLine[] = [];
  const chordsPerLine = 4; // Fixed at 4 REAL chords per line in 2C mode

  measureLines.forEach((line, lineIndex) => {
    // If line has repeat notation, don't split it (keep it as one unit)
    if (line.isRepeat) {
      result.push(line);
      return;
    }

    console.log(`\n=== Processing line ${lineIndex}, id: ${line.id} ===`);

    // Collect all real chords from all measures in this line
    const allChords: Array<{ chord: any; measureId: string; originalMeasure: any }> = [];

    line.measures.forEach((measure) => {
      measure.chords.forEach((chord) => {
        if (isRealChord(chord)) {
          allChords.push({ chord, measureId: measure.id, originalMeasure: measure });
        }
      });
    });

    console.log(`Total real chords in line: ${allChords.length}`);

    // Split into chunks of 4 chords each
    const chunks: typeof line.measures[] = [];
    for (let i = 0; i < allChords.length; i += chordsPerLine) {
      const chordChunk = allChords.slice(i, i + chordsPerLine);

      // Create a single measure containing these 4 chords
      const newMeasure = {
        id: `${line.id}-chunk-${i / chordsPerLine}`,
        chords: chordChunk.map(c => c.chord),
        rawText: '',
        isSplitBar: false,
      };

      chunks.push([newMeasure]);
      console.log(`  Created chunk with ${chordChunk.length} chords`);
    }

    // If no chunks were created (shouldn't happen), keep original
    if (chunks.length === 0) {
      result.push(line);
      return;
    }

    // Create new measure lines from chunks
    chunks.forEach((chunk, idx) => {
      result.push({
        id: `${line.id}-chunk-${idx}`,
        measures: chunk,
        isRepeat: false,
      });
    });
  });

  console.log(`\nTotal lines after splitting: ${result.length}\n`);
  return result;
};

export default function ChordTextOutput({ song, nashvilleMode, twoColumnLayout = false, fontSize = 'normal', alignment = 'left' }: ChordTextOutputProps) {
  const fontClass = getFontSizeClass(fontSize);
  const sectionFontClass = getSectionFontSizeClass(fontSize);
  const commentFontClass = getCommentFontSizeClass(fontSize);
  const hasMetadata = song.metadata.title || song.metadata.tempo || song.metadata.timeSignature ||
                      song.metadata.style || song.metadata.feel ||
                      (song.metadata.customProperties && Object.keys(song.metadata.customProperties).length > 0);

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'center': return 'mx-auto';
      case 'right': return 'ml-auto';
      default: return 'mr-auto';
    }
  };

  if (song.sections.length === 0) {
    return (
      <div className="text-gray-400 dark:text-gray-500 italic text-center py-12">
        Start typing to see your chart...
      </div>
    );
  }

  // Metadata display component
  const MetadataDisplay = () => {
    if (!hasMetadata) return null;

    return (
      <div className="mb-2 pb-1 border-b border-gray-300 print:hidden">
        {song.metadata.title && (
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 print:text-gray-900">{song.metadata.title}</h1>
            <span className="inline-flex items-center justify-center px-3 py-1 border-2 border-black dark:border-white print:border-black rounded-full text-lg font-black text-gray-900 dark:text-gray-100 print:text-gray-900">
              {song.metadata.key}
            </span>
          </div>
        )}
        <div className="flex gap-2 text-xs text-gray-700 dark:text-gray-300 print:text-gray-700 flex-wrap justify-center print:text-xs print:gap-1">
          {song.metadata.tempo && (
            <div>
              <strong className="font-semibold">Tempo:</strong> <span className="ml-1">{song.metadata.tempo} BPM</span>
            </div>
          )}
          {song.metadata.timeSignature && (
            <div>
              <strong className="font-semibold">Meter:</strong> <span className="ml-1">{song.metadata.timeSignature}</span>
            </div>
          )}
          {song.metadata.style && (
            <div>
              <strong className="font-semibold">Style:</strong> <span className="ml-1">{song.metadata.style}</span>
            </div>
          )}
          {song.metadata.feel && (
            <div>
              <strong className="font-semibold">Feel:</strong> <span className="ml-1">{song.metadata.feel}</span>
            </div>
          )}
          {song.metadata.customProperties && Object.keys(song.metadata.customProperties).length > 0 && (
            <>
              {Object.entries(song.metadata.customProperties).map(([key, value]) => (
                <div key={key}>
                  <strong className="font-semibold">{key}:</strong> <span className="ml-1">{value}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  // Function to render a single section
  const renderSection = (section: typeof song.sections[0]) => {
    // Check if this is a default/auto-generated section name
    const isDefaultSection = section.name === 'Section' || /^Section\s+\d+$/.test(section.name);

    // Split lines into 4-measure chunks if in two column mode
    const processedLines = section.measureLines && section.measureLines.length > 0
      ? splitMeasureLinesForTwoColumn(section.measureLines, twoColumnLayout)
      : [];

    return (
      <div key={section.id} className="pb-1 mb-1 avoid-page-break print:pb-2 print:mb-2" style={{ borderBottom: '0.5px solid #d1d5db' }}>
        {/* Section layout: name in left column, chords in right column */}
        <div className="flex gap-3">
          {/* Section Name Column - fixed width that scales with font size */}
          <div className={`flex-shrink-0 pr-2 ${fontSize === 'small' ? 'w-12' : fontSize === 'big' ? 'w-20' : fontSize === 'medium' ? 'w-16' : 'w-14'}`}>
            {!isDefaultSection && (
              <h3 className={`${sectionFontClass} font-bold text-gray-700 dark:text-gray-300 break-words leading-tight`}>
                {section.name}
              </h3>
            )}
          </div>

          {/* Measure lines */}
          <div className="flex-1 space-y-1.5">
          {processedLines.length > 0 ? (
            processedLines.map((line, lineIdx) => (
              <div key={line.id} className="flex items-start gap-2">
                {/* Line number */}
                <span className="text-xs text-gray-400 dark:text-gray-500 print:text-gray-400 w-4 mt-1">{lineIdx + 1}</span>

                {/* Repeat notation wrapper */}
                <div className="flex items-end gap-2">
                  {line.isRepeat && (
                    <span className="text-gray-700 dark:text-gray-300 print:text-gray-700 text-4xl self-end leading-none" style={{ fontFamily: "'Noto Music', sans-serif" }}>
                      𝄆
                    </span>
                  )}

                  {/* Measures on this line */}
                  <div className="flex gap-1 items-end">
                    {line.measures.map((measure) => (
                      <div key={measure.id} className="flex gap-0.5 items-end">
                        {/* Navigation Marker */}
                        {measure.navigationMarker ? (
                          <NavigationMarkerDisplay marker={measure.navigationMarker} />
                        ) : (
                          <>
                            {/* Inline meter change */}
                            {measure.meterChange && (
                              <span className="text-sm text-gray-600 dark:text-gray-400 print:text-gray-600 font-semibold self-center mr-1">
                                [{measure.meterChange}]
                              </span>
                            )}

                            {/* Multi-measure repeat */}
                            {measure.isRepeat && measure.repeatCount ? (
                              <div className="flex flex-col items-center border border-gray-400 dark:border-gray-500 print:border-gray-400 rounded px-3 py-2">
                                <span className="text-xl font-bold text-gray-700 dark:text-gray-300 print:text-gray-700">%</span>
                                {measure.repeatCount > 1 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-500">×{measure.repeatCount}</span>
                                )}
                              </div>
                            ) : (
                              <>
                                {/* Pipe separator - only if explicitly marked */}
                                {measure.showPipeBefore && (
                                  <span className="text-gray-400 dark:text-gray-500 print:text-gray-400 text-2xl font-thin mx-2">|</span>
                                )}

                                {/* Measure content - with optional tie (split bar) styling */}
                                <div className={`flex items-end ${measure.isSplitBar ? 'gap-0.5' : 'gap-1'}`}>
                                  {measure.chords.length > 0 ? (
                                    <>
                                      {/* Group chords by parentheses and render each chunk */}
                                      {groupChordsByParentheses(measure.chords).map((chunk, chunkIdx) => {
                                        const isFirstChunk = chunkIdx === 0;
                                        const shouldShowParentheses = chunk.needsParentheses && !chunk.chords[0]?.number.includes('_');
                                        const shouldShowOldStyleParentheses = measure.isSplitBar && !chunk.chords.some(c => c.inParentheses !== undefined) && !chunk.chords[0]?.number.includes('_');

                                        return (
                                          <div key={chunkIdx} className={`flex items-end ${shouldShowParentheses || shouldShowOldStyleParentheses ? 'gap-0.5' : 'gap-1'}`}>
                                            {/* Render ending circle BEFORE parenthesis - only for first chunk */}
                                            {isFirstChunk && (shouldShowParentheses || shouldShowOldStyleParentheses) && chunk.chords[0]?.ending && (
                                              <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-black dark:border-white print:border-black rounded-full text-xs font-extrabold text-black dark:text-white print:text-black self-end mb-1 mr-1">
                                                {chunk.chords[0].ending}
                                              </span>
                                            )}
                                            {/* Render left parenthesis */}
                                            {(shouldShowParentheses || shouldShowOldStyleParentheses) && (
                                              <span
                                                className={`text-black dark:text-white print:text-black font-semibold ${fontClass} self-end mb-1`}
                                                style={{ transform: 'scaleX(0.7)' }}
                                              >(</span>
                                            )}
                                            {chunk.chords.map((chord, chordIdx) => {
                                              const isFirstChordInFirstChunk = isFirstChunk && chordIdx === 0;
                                              return (
                                                <ChordDisplay
                                                  key={chord.id}
                                                  chord={{
                                                    ...chord,
                                                    // Don't render ending in ChordDisplay if it's first chord and has parentheses
                                                    ending: (isFirstChordInFirstChunk && (shouldShowParentheses || shouldShowOldStyleParentheses)) ? undefined : chord.ending
                                                  }}
                                                  nashvilleMode={nashvilleMode}
                                                  songKey={song.metadata.key}
                                                  fontSize={fontClass}
                                                />
                                              );
                                            })}
                                            {/* Render right parenthesis */}
                                            {(shouldShowParentheses || shouldShowOldStyleParentheses) && (
                                              <span className={`text-black dark:text-white print:text-black font-semibold ${fontClass} self-end mb-1`} style={{ transform: 'scaleX(0.7)' }}>)</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                      {measure.comment && (
                                        <span className={`text-gray-600 dark:text-gray-400 print:text-gray-600 ${commentFontClass} font-normal self-center ml-2 italic`}>
                                          {measure.comment}
                                        </span>
                                      )}
                                    </>
                                  ) : measure.comment ? (
                                    <span className={`text-gray-600 dark:text-gray-400 print:text-gray-600 ${commentFontClass} font-normal italic`}>
                                      {measure.comment}
                                    </span>
                                  ) : (
                                    <span className={`text-gray-300 dark:text-gray-600 print:text-gray-300 ${commentFontClass} italic`}>—</span>
                                  )}
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {line.isRepeat && (
                    <div className="flex flex-col items-center self-end">
                      {line.repeatMultiplier && (
                        <span className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-700 font-bold mb-1">
                          {line.repeatMultiplier}×
                        </span>
                      )}
                      <span className="text-gray-700 dark:text-gray-300 print:text-gray-700 text-4xl leading-none" style={{ fontFamily: "'Noto Music', sans-serif" }}>
                        𝄇
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            // Fallback to old format if no measureLines
            section.measures.map((measure, idx) => (
              <div key={measure.id} className="flex items-center gap-4">
                {measure.navigationMarker ? (
                  <NavigationMarkerDisplay marker={measure.navigationMarker} />
                ) : (
                  <>
                    <span className="text-xs text-gray-400 dark:text-gray-500 print:text-gray-400 w-6">{idx + 1}</span>
                    <div className={`flex items-end ${measure.isSplitBar ? 'gap-0.5' : 'gap-1'}`}>
                      {measure.chords.length > 0 ? (
                        <>
                          {/* Group chords by parentheses and render each chunk */}
                          {groupChordsByParentheses(measure.chords).map((chunk, chunkIdx) => {
                            const isFirstChunk = chunkIdx === 0;
                            const shouldShowParentheses = chunk.needsParentheses && !chunk.chords[0]?.number.includes('_');
                            const shouldShowOldStyleParentheses = measure.isSplitBar && !chunk.chords.some(c => c.inParentheses !== undefined) && !chunk.chords[0]?.number.includes('_');

                            return (
                              <div key={chunkIdx} className={`flex items-end ${shouldShowParentheses || shouldShowOldStyleParentheses ? 'gap-0.5' : 'gap-1'}`}>
                                {/* Render ending circle BEFORE parenthesis - only for first chunk */}
                                {isFirstChunk && (shouldShowParentheses || shouldShowOldStyleParentheses) && chunk.chords[0]?.ending && (
                                  <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-black dark:border-white print:border-black rounded-full text-xs font-extrabold text-black dark:text-white print:text-black self-end mb-1 mr-1">
                                    {chunk.chords[0].ending}
                                  </span>
                                )}
                                {/* Render left parenthesis */}
                                {(shouldShowParentheses || shouldShowOldStyleParentheses) && (
                                  <span
                                    className={`text-black dark:text-white print:text-black font-semibold ${fontClass} self-end mb-1`}
                                    style={{ transform: 'scaleX(0.7)' }}
                                  >(</span>
                                )}
                                {chunk.chords.map((chord, chordIdx) => {
                                  const isFirstChordInFirstChunk = isFirstChunk && chordIdx === 0;
                                  return (
                                    <ChordDisplay
                                      key={chord.id}
                                      chord={{
                                        ...chord,
                                        // Don't render ending in ChordDisplay if it's first chord and has parentheses
                                        ending: (isFirstChordInFirstChunk && (shouldShowParentheses || shouldShowOldStyleParentheses)) ? undefined : chord.ending
                                      }}
                                      nashvilleMode={nashvilleMode}
                                      songKey={song.metadata.key}
                                      fontSize={fontClass}
                                    />
                                  );
                                })}
                                {/* Render right parenthesis */}
                                {(shouldShowParentheses || shouldShowOldStyleParentheses) && (
                                  <span className={`text-black dark:text-white print:text-black font-semibold ${fontClass} self-end mb-1`} style={{ transform: 'scaleX(0.7)' }}>)</span>
                                )}
                              </div>
                            );
                          })}
                          {measure.comment && (
                            <span className={`text-gray-600 dark:text-gray-400 print:text-gray-600 ${commentFontClass} font-normal self-center ml-2 italic`}>
                              {measure.comment}
                            </span>
                          )}
                        </>
                      ) : measure.comment ? (
                        <span className={`text-gray-600 dark:text-gray-400 print:text-gray-600 ${commentFontClass} font-normal italic`}>
                          {measure.comment}
                        </span>
                      ) : (
                        <span className={`text-gray-300 dark:text-gray-600 print:text-gray-300 ${commentFontClass} italic`}>—</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
          </div>
        </div>
      </div>
    );
  };

  // Helper to render sections
  const renderSectionsWithPageBreaks = (sections: typeof song.sections) => {
    return sections.map((section) => {
      return renderSection(section);
    });
  };

  // Two column layout - split sections into left and right columns
  if (twoColumnLayout) {
    const midPoint = Math.ceil(song.sections.length / 2);
    const leftSections = song.sections.slice(0, midPoint);
    const rightSections = song.sections.slice(midPoint);

    return (
      <>
        <MetadataDisplay />
        <div className={`grid grid-cols-2 gap-8 print:gap-6 ${getAlignmentClass()} max-w-fit`}>
          <div>
            {renderSectionsWithPageBreaks(leftSections)}
          </div>
          <div>
            {renderSectionsWithPageBreaks(rightSections)}
          </div>
        </div>
      </>
    );
  }

  // Single column layout (default)
  return (
    <>
      <MetadataDisplay />
      <div className={`${getAlignmentClass()} max-w-fit`}>
        {renderSectionsWithPageBreaks(song.sections)}
      </div>
    </>
  );
}
