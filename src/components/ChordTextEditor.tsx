import { useState, useEffect } from 'react';
import { Song } from '../types/song';
import { parseChordTextWithMetadata, sectionsToChordText } from '../utils/jotChordParser';
import ChordTextOutput from './ChordTextOutput';

interface ChordTextEditorProps {
  song: Song;
  nashvilleMode: boolean;
  twoColumnLayout: boolean;
  fitToPage: boolean;
  onUpdate: (song: Song) => void;
}

export default function ChordTextEditor({ song, nashvilleMode, twoColumnLayout, fitToPage, onUpdate }: ChordTextEditorProps) {
  const [text, setText] = useState(() => sectionsToChordText(song.sections));

  // Update text when song changes externally (e.g., new song)
  useEffect(() => {
    setText(sectionsToChordText(song.sections));
  }, [song.id]);

  const handleTextChange = (value: string) => {
    setText(value);

    // Parse the text into sections and metadata
    const result = parseChordTextWithMetadata(value, nashvilleMode);

    onUpdate({
      ...song,
      sections: result.sections,
      metadata: {
        ...song.metadata,
        ...result.metadata,
      },
      updatedAt: new Date(),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1">
      {/* Input Editor */}
      <div className="bg-white rounded-lg shadow-md p-6 no-print">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Edit</h2>
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full h-[600px] px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono text-base resize-none"
          placeholder={`Title: Song Name
Key: C
Tempo: 120
Meter: 4/4
Style: Rock
$Artist: Artist Name

V1:
    1 4 5 1
    2- 5 1

CHORUS:
    4 5 6- 1
    4 5 1`}
          spellCheck={false}
        />
        <div className="mt-3 text-xs text-gray-500 space-y-1 border-t border-gray-200 pt-3 max-h-[200px] overflow-y-auto">
          <div className="font-semibold text-gray-700 mb-2">JotChord™ Syntax Reference:</div>

          <div className="font-semibold text-gray-600 mt-2">Metadata:</div>
          <div><code className="bg-gray-100 px-1 rounded">Title: Song Name</code> <code className="bg-gray-100 px-1 rounded">Key: C</code> <code className="bg-gray-100 px-1 rounded">Tempo: 120</code> <code className="bg-gray-100 px-1 rounded">Meter: 4/4</code></div>
          <div><code className="bg-gray-100 px-1 rounded">Style: Rock</code> <code className="bg-gray-100 px-1 rounded">Feel: Swing</code> <code className="bg-gray-100 px-1 rounded">$Artist: Name</code></div>

          <div className="font-semibold text-gray-600 mt-2">Sections:</div>
          <div><code className="bg-gray-100 px-1 rounded">V1:</code> <code className="bg-gray-100 px-1 rounded">CH:</code> <code className="bg-gray-100 px-1 rounded">BR:</code> (on own line)</div>

          <div className="font-semibold text-gray-600 mt-2">Chords:</div>
          <div><strong>Basic:</strong> <code className="bg-gray-100 px-1 rounded">1</code> <code className="bg-gray-100 px-1 rounded">2-</code> (minor) <code className="bg-gray-100 px-1 rounded">7o</code> (dim)</div>
          <div><strong>Accidentals:</strong> <code className="bg-gray-100 px-1 rounded">#5</code> (sharp) <code className="bg-gray-100 px-1 rounded">b7</code> (flat)</div>
          <div><strong>Qualities:</strong> <code className="bg-gray-100 px-1 rounded">2^</code> <code className="bg-gray-100 px-1 rounded">2M</code> (major) <code className="bg-gray-100 px-1 rounded">3+</code> (aug) <code className="bg-gray-100 px-1 rounded">5sus4</code> <code className="bg-gray-100 px-1 rounded">4add9</code></div>
          <div><strong>Extended:</strong> <code className="bg-gray-100 px-1 rounded">5**7</code> <code className="bg-gray-100 px-1 rounded">1**^7</code> <code className="bg-gray-100 px-1 rounded">5D7</code> <code className="bg-gray-100 px-1 rounded">1^7</code></div>
          <div><strong>Slash:</strong> <code className="bg-gray-100 px-1 rounded">1/3</code> (inversion) <code className="bg-gray-100 px-1 rounded">3^/#5</code></div>

          <div className="font-semibold text-gray-600 mt-2">Rhythm:</div>
          <div><strong>Diamond:</strong> <code className="bg-gray-100 px-1 rounded">&lt;1&gt;</code> (whole note/let ring)</div>
          <div><strong>Ticks:</strong> <code className="bg-gray-100 px-1 rounded">1...</code> (3 beats) <code className="bg-gray-100 px-1 rounded">1_6-.</code> (split with tick)</div>
          <div><strong>Push:</strong> <code className="bg-gray-100 px-1 rounded">5&lt;</code> (early) <code className="bg-gray-100 px-1 rounded">4&gt;</code> (late)</div>
          <div><strong>Ties:</strong> <code className="bg-gray-100 px-1 rounded">1= 1</code> (tie between chords)</div>
          <div><strong>Fermata:</strong> <code className="bg-gray-100 px-1 rounded">&lt;1&gt;~</code> (fermata above chord)</div>
          <div><strong>Accent:</strong> <code className="bg-gray-100 px-1 rounded">4!</code> (marcato/accent)</div>
          <div><strong>Note values:</strong> <code className="bg-gray-100 px-1 rounded">4e</code> (eighth) <code className="bg-gray-100 px-1 rounded">1w</code> (whole) <code className="bg-gray-100 px-1 rounded">2h</code> (half)</div>

          <div className="font-semibold text-gray-600 mt-2">Special:</div>
          <div><strong>No chord:</strong> <code className="bg-gray-100 px-1 rounded">X</code> (rest) <code className="bg-gray-100 px-1 rounded">X_5</code> (half rest + chord)</div>
          <div><strong>Walk:</strong> <code className="bg-gray-100 px-1 rounded">2@wd</code> (↘ down) <code className="bg-gray-100 px-1 rounded">4@wu</code> (↗ up)</div>
          <div><strong>Modulation:</strong> <code className="bg-gray-100 px-1 rounded">1mod+2</code> (up 2) <code className="bg-gray-100 px-1 rounded">1mod-1</code> (down 1)</div>
          <div><strong>Separator:</strong> <code className="bg-gray-100 px-1 rounded">*</code> (group separator - filled circle)</div>

          <div className="font-semibold text-gray-600 mt-2">Split Bars:</div>
          <div><code className="bg-gray-100 px-1 rounded">1_6-</code> <code className="bg-gray-100 px-1 rounded">(1 4)</code> <code className="bg-gray-100 px-1 rounded">(51)</code> <code className="bg-gray-100 px-1 rounded">[1234]</code> (multiple chords in one measure)</div>

          <div className="font-semibold text-gray-600 mt-2">Repeats:</div>
          <div><strong>Standard:</strong> <code className="bg-gray-100 px-1 rounded">||: 1 4 5 1 :||</code> <code className="bg-gray-100 px-1 rounded">||: 1 4 :||{'{'}4{'}'}</code> (repeat 4x)</div>
          <div><strong>Multi-measure:</strong> <code className="bg-gray-100 px-1 rounded">%</code> (1 bar) <code className="bg-gray-100 px-1 rounded">%%</code> (2 bars) etc</div>
          <div><strong>Endings:</strong> <code className="bg-gray-100 px-1 rounded">1[2 4 5]</code> <code className="bg-gray-100 px-1 rounded">2[1 1 1]</code> (numbered endings)</div>

          <div className="font-semibold text-gray-600 mt-2">Comments & Meter:</div>
          <div><code className="bg-gray-100 px-1 rounded">//comment</code> <code className="bg-gray-100 px-1 rounded">/* block */</code> <code className="bg-gray-100 px-1 rounded">1/*inline*/</code></div>
          <div><code className="bg-gray-100 px-1 rounded">[3/8] 1 4</code> (inline meter change)</div>
        </div>
      </div>

      {/* Output Preview */}
      <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none print:p-0">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 no-print">Preview</h2>
        <div className={`h-[600px] overflow-y-auto print:h-auto print:overflow-visible ${fitToPage ? 'print-fit-to-page' : ''}`}>
          <ChordTextOutput
            song={song}
            nashvilleMode={nashvilleMode}
            twoColumnLayout={twoColumnLayout}
            fitToPage={fitToPage}
          />
        </div>
      </div>
    </div>
  );
}
