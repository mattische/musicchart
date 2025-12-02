import { Measure, Chord } from '../types/song';
import ChordCell from './ChordCell';

interface MeasureEditorProps {
  measure: Measure;
  nashvilleMode: boolean;
  songKey: string;
  onUpdate: (measure: Measure) => void;
  onDelete: () => void;
}

export default function MeasureEditor({
  measure,
  nashvilleMode,
  songKey,
  onUpdate,
  onDelete,
}: MeasureEditorProps) {
  const addChord = () => {
    const newChord: Chord = {
      id: `chord-${Date.now()}`,
      number: '',
      nashvilleMode,
    };
    onUpdate({
      ...measure,
      chords: [...measure.chords, newChord],
    });
  };

  const updateChord = (chordId: string, updatedChord: Chord) => {
    onUpdate({
      ...measure,
      chords: measure.chords.map((c) =>
        c.id === chordId ? updatedChord : c
      ),
    });
  };

  const deleteChord = (chordId: string) => {
    onUpdate({
      ...measure,
      chords: measure.chords.filter((c) => c.id !== chordId),
    });
  };

  return (
    <div className="relative border-2 border-gray-300 rounded-lg p-3 bg-gray-50 hover:border-blue-400 transition-colors group">
      <button
        onClick={onDelete}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-xs"
        title="Delete measure"
      >
        ×
      </button>

      <div className="flex flex-wrap gap-2 min-h-[80px] items-start">
        {measure.chords.map((chord) => (
          <ChordCell
            key={chord.id}
            chord={chord}
            nashvilleMode={nashvilleMode}
            songKey={songKey}
            onUpdate={(updatedChord) => updateChord(chord.id, updatedChord)}
            onDelete={() => deleteChord(chord.id)}
          />
        ))}
        <button
          onClick={addChord}
          className="px-3 py-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded border border-dashed border-gray-300 hover:border-blue-400 transition-colors text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}
