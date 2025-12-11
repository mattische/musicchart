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
    case 'normal': return 'text-2xl';
    case 'medium': return 'text-3xl';
    case 'big': return 'text-4xl';
    default: return 'text-2xl';
  }
};

// Helper to check if a chord is a "real" chord (not separator or repeat symbol)
const isRealChord = (chord: any): boolean => {
  if (!chord || !chord.number) return false;
  // Separators and repeat symbols are not real chords
  return chord.number !== '*' && chord.number !== '%';
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
            <span className="inline-flex items-center justify-center px-2 py-0.5 border border-black dark:border-white print:border-black rounded-full text-sm font-extrabold text-gray-900 dark:text-gray-100 print:text-gray-900">
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
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 break-words leading-tight">
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
                                      {/* Render ending circle BEFORE parenthesis for split bars */}
                                      {measure.isSplitBar && measure.chords[0]?.ending && !measure.chords[0]?.number.includes('_') && (
                                        <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-black dark:border-white print:border-black rounded-full text-xs font-extrabold text-black dark:text-white print:text-black self-end mb-1 mr-1">
                                          {measure.chords[0].ending}
                                        </span>
                                      )}
                                      {/* Render left parenthesis */}
                                      {measure.isSplitBar && !measure.chords[0]?.number.includes('_') && (
                                        <span
                                          className={`text-black dark:text-white print:text-black font-semibold ${fontClass} self-end mb-1`}
                                          style={{ transform: 'scaleX(0.7)' }}
                                        >(</span>
                                      )}
                                      {measure.chords.map((chord, chordIdx) => (
                                        <ChordDisplay
                                          key={chord.id}
                                          chord={{
                                            ...chord,
                                            // Don't render ending in ChordDisplay if it's first chord in split bar (already rendered above)
                                            ending: (chordIdx === 0 && measure.isSplitBar && !chord.number.includes('_')) ? undefined : chord.ending
                                          }}
                                          nashvilleMode={nashvilleMode}
                                          songKey={song.metadata.key}
                                          fontSize={fontClass}
                                        />
                                      ))}
                                      {measure.isSplitBar && !measure.chords[0]?.number.includes('_') && (
                                        <span className={`text-black dark:text-white print:text-black font-semibold ${fontClass} self-end mb-1`} style={{ transform: 'scaleX(0.7)' }}>)</span>
                                      )}
                                      {measure.comment && (
                                        <span className="text-gray-600 dark:text-gray-400 print:text-gray-600 text-sm font-normal self-center ml-2 italic">
                                          {measure.comment}
                                        </span>
                                      )}
                                    </>
                                  ) : measure.comment ? (
                                    <span className="text-gray-600 dark:text-gray-400 print:text-gray-600 text-sm font-normal italic">
                                      {measure.comment}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 dark:text-gray-600 print:text-gray-300 text-sm italic">—</span>
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
                          {/* Render ending circle BEFORE parenthesis for split bars */}
                          {measure.isSplitBar && measure.chords[0]?.ending && !measure.chords[0]?.number.includes('_') && (
                            <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-black dark:border-white print:border-black rounded-full text-xs font-extrabold text-black dark:text-white print:text-black self-end mb-1 mr-1">
                              {measure.chords[0].ending}
                            </span>
                          )}
                          {/* Render left parenthesis */}
                          {measure.isSplitBar && !measure.chords[0]?.number.includes('_') && (
                            <span
                              className={`text-black dark:text-white print:text-black font-semibold ${fontClass} self-end mb-1`}
                              style={{ transform: 'scaleX(0.7)' }}
                            >(</span>
                          )}
                          {measure.chords.map((chord, chordIdx) => (
                            <ChordDisplay
                              key={chord.id}
                              chord={{
                                ...chord,
                                // Don't render ending in ChordDisplay if it's first chord in split bar (already rendered above)
                                ending: (chordIdx === 0 && measure.isSplitBar && !chord.number.includes('_')) ? undefined : chord.ending
                              }}
                              nashvilleMode={nashvilleMode}
                              songKey={song.metadata.key}
                              fontSize={fontClass}
                            />
                          ))}
                          {measure.isSplitBar && !measure.chords[0]?.number.includes('_') && (
                            <span className={`text-black dark:text-white print:text-black font-semibold ${fontClass} self-end mb-1`} style={{ transform: 'scaleX(0.7)' }}>)</span>
                          )}
                          {measure.comment && (
                            <span className="text-gray-600 dark:text-gray-400 print:text-gray-600 text-sm font-normal self-center ml-2 italic">
                              {measure.comment}
                            </span>
                          )}
                        </>
                      ) : measure.comment ? (
                        <span className="text-gray-600 dark:text-gray-400 print:text-gray-600 text-sm font-normal italic">
                          {measure.comment}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 print:text-gray-300 text-sm italic">—</span>
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
