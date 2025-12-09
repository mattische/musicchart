import { Song } from '../types/song';
import ChordDisplay from './ChordDisplay';

interface ChordTextOutputProps {
  song: Song;
  nashvilleMode: boolean;
  twoColumnLayout?: boolean;
  fitToPage?: boolean;
  fontSize?: string;
}

const getFontSizeClass = (size: string) => {
  switch (size) {
    case 'small': return 'text-base';
    case 'normal': return 'text-2xl';
    case 'medium': return 'text-3xl';
    case 'big': return 'text-4xl';
    default: return 'text-2xl';
  }
};

export default function ChordTextOutput({ song, nashvilleMode, twoColumnLayout = false, fontSize = 'normal' }: ChordTextOutputProps) {
  const fontClass = getFontSizeClass(fontSize);
  const hasMetadata = song.metadata.title || song.metadata.tempo || song.metadata.timeSignature ||
                      song.metadata.style || song.metadata.feel ||
                      (song.metadata.customProperties && Object.keys(song.metadata.customProperties).length > 0);

  if (song.sections.length === 0) {
    return (
      <div className="text-gray-400 italic text-center py-12">
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
          <h1 className="text-lg font-bold text-gray-900 mb-1">{song.metadata.title}</h1>
        )}
        <div className="flex gap-2 text-xs text-gray-700 flex-wrap print:text-xs print:gap-1">
          <div>
            <strong className="font-semibold">Key:</strong> <span className="ml-1">{song.metadata.key}</span>
          </div>
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

    return (
      <div key={section.id} className="pb-1 mb-1 space-y-0.5 border-b border-gray-300 avoid-page-break print:space-y-1 print:pb-2 print:mb-2 print:border-gray-400">
        {/* Section Name - only show if not a default section */}
        {!isDefaultSection && (
          <div className="mb-0.5">
            <h3 className="text-base font-bold text-gray-900 inline-block print:text-lg">
              {section.name}
            </h3>
          </div>
        )}

        {/* Measure lines - each line from input on its own row */}
        <div className="space-y-1.5">
          {section.measureLines && section.measureLines.length > 0 ? (
            section.measureLines.map((line, lineIdx) => (
              <div key={line.id} className="flex items-start gap-2">
                {/* Line number */}
                <span className="text-xs text-gray-400 w-4 mt-1">{lineIdx + 1}</span>

                {/* Repeat notation wrapper */}
                <div className="flex items-end gap-1">
                  {line.isRepeat && (
                    <span className="text-gray-600 text-xl self-end">
                      <span className="font-bold">|</span>
                      <span className="font-normal">|:</span>
                    </span>
                  )}

                  {/* Measures on this line */}
                  <div className="flex gap-1 items-end">
                    {line.measures.map((measure) => (
                      <div key={measure.id} className="flex gap-0.5 items-end">
                        {/* Inline meter change */}
                        {measure.meterChange && (
                          <span className="text-sm text-gray-600 font-semibold self-center mr-1">
                            [{measure.meterChange}]
                          </span>
                        )}

                        {/* Multi-measure repeat */}
                        {measure.isRepeat && measure.repeatCount ? (
                          <div className="flex flex-col items-center border border-gray-400 rounded px-3 py-2">
                            <span className="text-xl font-bold text-gray-700">%</span>
                            {measure.repeatCount > 1 && (
                              <span className="text-xs text-gray-500">×{measure.repeatCount}</span>
                            )}
                          </div>
                        ) : (
                          <>
                            {/* Pipe separator - only if explicitly marked */}
                            {measure.showPipeBefore && (
                              <span className="text-gray-400 text-2xl font-thin mx-2">|</span>
                            )}

                            {/* Measure content - with optional tie (split bar) styling */}
                            <div className={`flex items-end ${measure.isSplitBar ? 'gap-0.5' : 'gap-1'}`}>
                              {measure.chords.length > 0 ? (
                                <>
                                  {measure.isSplitBar && !measure.chords[0]?.number.includes('_') && (
                                    <span className={`text-black font-light ${fontClass} self-end mb-1`} style={{ transform: 'scaleX(0.7)' }}>(</span>
                                  )}
                                  {measure.chords.map((chord) => (
                                    <ChordDisplay
                                      key={chord.id}
                                      chord={chord}
                                      nashvilleMode={nashvilleMode}
                                      songKey={song.metadata.key}
                                      fontSize={fontClass}
                                    />
                                  ))}
                                  {measure.isSplitBar && !measure.chords[0]?.number.includes('_') && (
                                    <span className={`text-black font-light ${fontClass} self-end mb-1`} style={{ transform: 'scaleX(0.7)' }}>)</span>
                                  )}
                                  {measure.comment && (
                                    <span className="text-gray-600 text-sm font-normal self-center ml-2 italic">
                                      {measure.comment}
                                    </span>
                                  )}
                                </>
                              ) : measure.comment ? (
                                <span className="text-gray-600 text-sm font-normal italic">
                                  {measure.comment}
                                </span>
                              ) : (
                                <span className="text-gray-300 text-sm italic">—</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {line.isRepeat && (
                    <div className="flex flex-col items-center self-end">
                      {line.repeatMultiplier && (
                        <span className="text-xs text-gray-600 font-semibold mb-0.5">
                          {line.repeatMultiplier}×
                        </span>
                      )}
                      <span className="text-gray-600 text-xl">
                        <span className="font-normal">:|</span>
                        <span className="font-bold">|</span>
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
                <span className="text-xs text-gray-400 w-6">{idx + 1}</span>
                <div className={`flex items-end ${measure.isSplitBar ? 'gap-0.5' : 'gap-1'}`}>
                  {measure.chords.length > 0 ? (
                    <>
                      {measure.isSplitBar && !measure.chords[0]?.number.includes('_') && (
                        <span className={`text-black font-light ${fontClass} self-end mb-1`} style={{ transform: 'scaleX(0.7)' }}>(</span>
                      )}
                      {measure.chords.map((chord) => (
                        <ChordDisplay
                          key={chord.id}
                          chord={chord}
                          nashvilleMode={nashvilleMode}
                          songKey={song.metadata.key}
                          fontSize={fontClass}
                        />
                      ))}
                      {measure.isSplitBar && !measure.chords[0]?.number.includes('_') && (
                        <span className={`text-black font-light ${fontClass} self-end mb-1`} style={{ transform: 'scaleX(0.7)' }}>)</span>
                      )}
                      {measure.comment && (
                        <span className="text-gray-600 text-sm font-normal self-center ml-2 italic">
                          {measure.comment}
                        </span>
                      )}
                    </>
                  ) : measure.comment ? (
                    <span className="text-gray-600 text-sm font-normal italic">
                      {measure.comment}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-sm italic">—</span>
                  )}
                </div>
              </div>
            ))
          )}
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
        <div className="grid grid-cols-2 gap-8 print:gap-6">
          <div>
            {renderSectionsWithPageBreaks(leftSections)}
          </div>
          <div className="border-l-2 border-gray-300 pl-8 print:pl-6 print:border-gray-400">
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
      <div>
        {renderSectionsWithPageBreaks(song.sections)}
      </div>
    </>
  );
}
