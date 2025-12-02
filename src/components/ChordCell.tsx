import { useState, useRef, useEffect } from 'react';
import { Chord, NoteValue } from '../types/song';
import { nashvilleToChord, chordToNashville } from '../utils/chordConverter';

interface ChordCellProps {
  chord: Chord;
  nashvilleMode: boolean;
  songKey: string;
  onUpdate: (chord: Chord) => void;
  onDelete: () => void;
}

export default function ChordCell({
  chord,
  nashvilleMode,
  songKey,
  onUpdate,
  onDelete,
}: ChordCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(chord.number);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() !== chord.number) {
      onUpdate({ ...chord, number: editValue.trim() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(chord.number);
      setIsEditing(false);
    } else if (e.key === 'Backspace' && editValue === '' && chord.number === '') {
      onDelete();
    }
  };

  const displayValue = () => {
    if (!chord.number) return '';

    // If chord was originally in Nashville mode and we're now in chord mode
    if (chord.nashvilleMode && !nashvilleMode) {
      return nashvilleToChord(chord.number, songKey as any);
    }
    // If chord was originally in chord mode and we're now in Nashville mode
    else if (!chord.nashvilleMode && nashvilleMode) {
      return chordToNashville(chord.number, songKey as any);
    }
    // Same mode as original
    return chord.number;
  };

  const toggleNoteValue = (value: NoteValue) => {
    if (chord.annotation?.value === value) {
      // Remove annotation if clicking the same value
      onUpdate({ ...chord, annotation: undefined });
    } else {
      // Set new annotation
      onUpdate({
        ...chord,
        annotation: {
          value,
          dotted: false,
          triplet: false,
        },
      });
    }
  };

  const toggleDotted = () => {
    if (chord.annotation) {
      onUpdate({
        ...chord,
        annotation: {
          ...chord.annotation,
          dotted: !chord.annotation.dotted,
        },
      });
    }
  };

  const noteSymbol = (value: NoteValue) => {
    switch (value) {
      case 'w': return '𝅝'; // Whole note
      case 'h': return '𝅗𝅥'; // Half note
      case 'q': return '♩'; // Quarter note
      case 'e': return '♪'; // Eighth note
      case 's': return '𝅘𝅥𝅯'; // Sixteenth note
      case 't': return '𝅘𝅥𝅰'; // Thirty-second note
      default: return '';
    }
  };

  return (
    <div className="relative group">
      {/* Note annotation above chord */}
      {chord.annotation && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-1">
          <span className="text-2xl">
            {noteSymbol(chord.annotation.value)}
          </span>
          {chord.annotation.dotted && (
            <span className="text-sm">•</span>
          )}
          {chord.annotation.triplet && (
            <span className="text-xs">3</span>
          )}
        </div>
      )}

      {/* Chord value */}
      <div className="relative pt-2">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-16 px-2 py-1 text-center border-2 border-blue-500 rounded bg-white text-lg font-semibold"
            placeholder={nashvilleMode ? '1' : 'C'}
          />
        ) : (
          <div
            onClick={() => {
              setIsEditing(true);
              setEditValue(chord.number);
            }}
            className="w-16 px-2 pt-1 pb-2 text-center border-2 border-gray-300 rounded bg-white hover:border-blue-400 cursor-text text-lg font-semibold h-[40px] flex items-start justify-center"
          >
            {displayValue() || (
              <span className="text-gray-400 text-sm">
                {nashvilleMode ? '1' : 'C'}
              </span>
            )}
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={onDelete}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-xs leading-none"
        >
          ×
        </button>
      </div>

      {/* Note value selector - appears on hover */}
      <div className="absolute left-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 p-2 flex flex-col space-y-1">
        <div className="text-xs text-gray-600 mb-1">Note value:</div>
        <button
          onClick={() => toggleNoteValue('q')}
          className={`text-xl hover:bg-blue-100 px-2 py-1 rounded ${
            chord.annotation?.value === 'q' ? 'bg-blue-200' : ''
          }`}
          title="Quarter note"
        >
          ♩
        </button>
        <button
          onClick={() => toggleNoteValue('e')}
          className={`text-xl hover:bg-blue-100 px-2 py-1 rounded ${
            chord.annotation?.value === 'e' ? 'bg-blue-200' : ''
          }`}
          title="Eighth note"
        >
          ♪
        </button>
        <button
          onClick={() => toggleNoteValue('h')}
          className={`text-xl hover:bg-blue-100 px-2 py-1 rounded ${
            chord.annotation?.value === 'h' ? 'bg-blue-200' : ''
          }`}
          title="Half note"
        >
          𝅗𝅥
        </button>
        <button
          onClick={() => toggleNoteValue('w')}
          className={`text-xl hover:bg-blue-100 px-2 py-1 rounded ${
            chord.annotation?.value === 'w' ? 'bg-blue-200' : ''
          }`}
          title="Whole note"
        >
          𝅝
        </button>
        {chord.annotation && (
          <>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              onClick={toggleDotted}
              className={`text-sm hover:bg-blue-100 px-2 py-1 rounded ${
                chord.annotation.dotted ? 'bg-blue-200' : ''
              }`}
            >
              Dotted •
            </button>
          </>
        )}
      </div>
    </div>
  );
}
