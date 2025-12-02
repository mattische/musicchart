import { useState } from 'react';
import { Section } from '../types/song';
import { parseChordText } from '../utils/chordParser';
import ChordDisplay from './ChordDisplay';

interface DocumentEditorProps {
  section: Section;
  nashvilleMode: boolean;
  songKey: string;
  onUpdate: (section: Section) => void;
  onDelete: () => void;
}

export default function DocumentEditor({
  section,
  nashvilleMode,
  songKey,
  onUpdate,
  onDelete,
}: DocumentEditorProps) {
  // Combine all measures into a single text representation
  const measuresText = section.measures.map((m) => m.rawText || '').join(' | ');
  const [text, setText] = useState(measuresText);

  const handleTextChange = (value: string) => {
    setText(value);

    // Split by pipe | to create measures
    const measureTexts = value.split('|').map((t) => t.trim());

    const measures = measureTexts.map((measureText, index) => {
      const { chords, comment } = parseChordText(measureText, nashvilleMode);
      return {
        id: section.measures[index]?.id || `measure-${Date.now()}-${index}`,
        chords,
        comment,
        rawText: measureText,
      };
    });

    onUpdate({
      ...section,
      measures: measures.length > 0 ? measures : [{ id: `measure-${Date.now()}`, chords: [], rawText: '' }],
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          value={section.name}
          onChange={(e) => onUpdate({ ...section, name: e.target.value })}
          className="text-xl font-semibold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-2 py-1"
          placeholder="Section name"
        />
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 px-3 py-1 rounded hover:bg-red-50 transition-colors text-sm"
        >
          Delete Section
        </button>
      </div>

      {/* Text input area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Edit (use | to separate measures):
        </label>
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono text-base"
          rows={3}
          placeholder="1... 4! 5 1 | 2- 5 1 | 4 5 1..."
        />
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <div><strong>Syntax:</strong> <code className="bg-gray-100 px-2 py-0.5 rounded">1 4 5</code> = ackord, <code className="bg-gray-100 px-2 py-0.5 rounded">|</code> = ny takt</div>
          <div><strong>Beats:</strong> <code className="bg-gray-100 px-2 py-0.5 rounded">1...</code> = 3 beats (punkter ovanför)</div>
          <div><strong>Accent:</strong> <code className="bg-gray-100 px-2 py-0.5 rounded">4!</code> = accent mark</div>
          <div><strong>Comment:</strong> <code className="bg-gray-100 px-2 py-0.5 rounded">//your comment</code></div>
        </div>
      </div>

      {/* Rendered output preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preview:
        </label>
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[120px]">
          <div className="flex flex-wrap gap-6">
            {section.measures.map((measure, idx) => (
              <div key={measure.id} className="relative">
                {idx > 0 && (
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-gray-400">|</span>
                )}
                <div className="flex gap-3 items-end pb-2">
                  {measure.chords.length > 0 ? (
                    <>
                      {measure.chords.map((chord) => (
                        <ChordDisplay
                          key={chord.id}
                          chord={chord}
                          nashvilleMode={nashvilleMode}
                          songKey={songKey}
                        />
                      ))}
                      {measure.comment && (
                        <span className="text-gray-600 text-sm font-normal self-center ml-2">
                          //{measure.comment}
                        </span>
                      )}
                    </>
                  ) : measure.comment ? (
                    <span className="text-gray-600 text-sm font-normal">
                      //{measure.comment}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm italic">empty</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
