import { useState, useRef, useEffect } from 'react';
import { Measure, Chord } from '../types/song';
import { parseChordText, chordsToText } from '../utils/chordParser';
import { nashvilleToChord } from '../utils/chordConverter';

interface TextMeasureEditorProps {
  measure: Measure;
  nashvilleMode: boolean;
  songKey: string;
  onUpdate: (measure: Measure) => void;
  onDelete: () => void;
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export default function TextMeasureEditor({
  measure,
  nashvilleMode,
  songKey,
  onUpdate,
  onDelete,
  onNavigate,
}: TextMeasureEditorProps) {
  const [text, setText] = useState(measure.rawText || chordsToText(measure.chords, measure.comment));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update text when measure changes externally
  useEffect(() => {
    if (!isFocused) {
      setText(measure.rawText || chordsToText(measure.chords, measure.comment));
    }
  }, [measure, isFocused]);

  const handleChange = (value: string) => {
    setText(value);
    // Parse and update in real-time
    const { chords, comment } = parseChordText(value, nashvilleMode);
    onUpdate({
      ...measure,
      rawText: value,
      chords,
      comment,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onNavigate('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onNavigate('down');
    } else if (e.key === 'ArrowLeft' && inputRef.current?.selectionStart === 0) {
      e.preventDefault();
      onNavigate('left');
    } else if (e.key === 'ArrowRight' && inputRef.current?.selectionStart === text.length) {
      e.preventDefault();
      onNavigate('right');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onNavigate('down');
    } else if (e.key === 'Backspace' && text === '') {
      e.preventDefault();
      onDelete();
    }
  };

  const renderChordDisplay = (chord: Chord) => {
    const displayNumber = nashvilleMode ? chord.number : nashvilleToChord(chord.number, songKey as any);

    return (
      <span key={chord.id} className="inline-flex items-center mx-1">
        {chord.accent && <span className="text-red-600 font-bold mr-0.5">!</span>}
        <span className="font-semibold text-gray-800">{displayNumber}</span>
        {chord.beats && chord.beats > 0 && (
          <span className="text-blue-600 ml-0.5">
            {'.'.repeat(chord.beats)}
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="relative border-2 border-gray-300 rounded-lg bg-gray-50 hover:border-blue-400 transition-colors group min-h-[80px]">
      <button
        onClick={onDelete}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-xs z-10"
        title="Delete measure"
      >
        ×
      </button>

      <div className="p-3">
        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-2"
          placeholder="1 4 5 1"
        />

        {/* Formatted display */}
        <div className="min-h-[24px] text-lg">
          {measure.chords.length > 0 ? (
            <>
              {measure.chords.map(renderChordDisplay)}
              {measure.comment && (
                <span className="text-gray-600 text-sm font-normal ml-2">
                  //{measure.comment}
                </span>
              )}
            </>
          ) : measure.comment ? (
            <span className="text-gray-600 text-sm font-normal">
              //{measure.comment}
            </span>
          ) : (
            <span className="text-gray-400 text-sm">Empty measure</span>
          )}
        </div>

        {/* Help text */}
        {isFocused && (
          <div className="mt-2 text-xs text-gray-500 space-y-0.5">
            <div>Syntax: <code className="bg-gray-200 px-1 rounded">1 4 5 1</code></div>
            <div>Beats: <code className="bg-gray-200 px-1 rounded">1...</code> = 3 beats</div>
            <div>Accent: <code className="bg-gray-200 px-1 rounded">4!</code></div>
            <div>Comment: <code className="bg-gray-200 px-1 rounded">//your comment</code></div>
            <div>Navigate: <kbd className="bg-gray-200 px-1 rounded">↑↓←→</kbd> or <kbd className="bg-gray-200 px-1 rounded">Enter</kbd></div>
          </div>
        )}
      </div>
    </div>
  );
}
