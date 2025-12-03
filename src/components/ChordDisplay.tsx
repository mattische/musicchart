import { Chord } from '../types/song';
import { nashvilleToChord } from '../utils/chordConverter';

interface ChordDisplayProps {
  chord: Chord;
  nashvilleMode: boolean;
  songKey: string;
  fontSize?: string;
}

export default function ChordDisplay({ chord, nashvilleMode, songKey, fontSize = 'text-2xl' }: ChordDisplayProps) {
  // Handle separator (*)
  if (chord.number === '*') {
    return (
      <div className="relative inline-flex flex-col items-center justify-center min-w-[40px] self-center mb-2">
        <div className="w-3 h-3 bg-black rounded-full print:bg-black"></div>
      </div>
    );
  }

  // Handle repeat symbol (%)
  if (chord.number === '%') {
    return (
      <div className="relative inline-flex flex-col items-center min-w-[40px]">
        <span className={`${fontSize} font-bold text-black`}>%</span>
      </div>
    );
  }

  // Handle no chord / rest (X)
  if (chord.isRest || chord.number === 'X' || chord.number.startsWith('X_')) {
    return (
      <div className="relative inline-flex flex-col items-center min-w-[40px]">
        <span className={`${fontSize} font-bold text-black`}>{chord.number}</span>
      </div>
    );
  }

  let displayNumber = nashvilleMode
    ? chord.number
    : nashvilleToChord(chord.number, songKey as any);

  // Check if chord has underline and remove underscore from display
  const hasUnderline = displayNumber.includes('_');
  if (hasUnderline) {
    displayNumber = displayNumber.replace(/_/g, '');
  }

  // Get note symbol from value
  const getNoteSymbol = (value: string) => {
    switch (value) {
      case 'w': return '𝅝';  // Whole note
      case 'h': return '𝅗𝅥';  // Half note
      case 'q': return '♩';   // Quarter note
      case 'e': return '♪';   // Eighth note
      case 's': return '𝅘𝅥𝅯';  // Sixteenth note
      case 't': return '𝅘𝅥𝅰';  // 32nd note
      default: return '';
    }
  };

  // Render beat marks above the chord
  const renderBeats = () => {
    if (!chord.beats || chord.beats === 0) return null;

    return (
      <div className="flex gap-1 justify-center mb-1">
        {Array.from({ length: chord.beats }).map((_, i) => (
          <span key={i} className="w-[3px] h-2 bg-black"></span>
        ))}
      </div>
    );
  };

  // Render note value above chord
  const renderNoteValue = () => {
    if (!chord.annotation?.value) return null;

    return (
      <div className="flex justify-center mb-0.5">
        <span className="text-2xl text-gray-700">
          {getNoteSymbol(chord.annotation.value)}
        </span>
      </div>
    );
  };

  // Render push indicator - above chord
  const renderPush = () => {
    if (!chord.push) return null;

    return (
      <div className="flex justify-center mb-0.5">
        <span className="text-black font-bold text-lg">
          {chord.push === 'early' ? '<' : '>'}
        </span>
      </div>
    );
  };

  return (
    <div className="relative inline-flex flex-col items-center min-w-[40px]">
      {/* Ending number above chord (shown as circle) */}
      {chord.ending && (
        <div className="flex justify-center mb-1">
          <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-black rounded-full text-xs font-bold text-black">
            {chord.ending}
          </span>
        </div>
      )}

      {/* Fermata above chord */}
      {chord.fermata && (
        <div className="flex justify-center mb-0.5">
          <span className="text-2xl text-black">𝄐</span>
        </div>
      )}

      {/* Note value above chord */}
      {renderNoteValue()}

      {/* Beats shown as dots above */}
      {renderBeats()}

      {/* Push indicator above chord */}
      {renderPush()}

      {/* Modulation indicator above chord */}
      {chord.modulation && (
        <div className="flex justify-center mb-0.5">
          <span className="text-xs text-gray-700 font-semibold">
            mod{chord.modulation > 0 ? '+' : ''}{chord.modulation}
          </span>
        </div>
      )}

      {/* Inline comment above chord */}
      {chord.inlineComment && (
        <div className="flex justify-center mb-0.5">
          <span className="text-xs text-gray-600 italic">
            {chord.inlineComment}
          </span>
        </div>
      )}

      {/* Chord */}
      <div className="relative px-1 flex items-center">
        {/* Diamond (whole note) or regular chord */}
        {chord.diamond ? (
          <span className="inline-block relative w-8 h-8 align-baseline">
            <span className="absolute inset-0 border-2 border-black bg-white transform rotate-45"></span>
            <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-black z-10">
              {displayNumber}
            </span>
          </span>
        ) : (
          <span
            className={`${fontSize} font-bold text-black`}
            style={{
              borderBottom: hasUnderline ? '2px solid black' : '2px solid transparent',
              display: 'inline-block',
              paddingBottom: '0px'
            }}
          >
            {displayNumber}
          </span>
        )}

        {/* Tie (=) - directly after chord */}
        {chord.tie && (
          <span className={`text-black font-bold ${fontSize} ml-0.5`}>=</span>
        )}

        {/* Accent mark (!) - directly after chord */}
        {chord.accent && (
          <span className={`text-black font-bold ${fontSize} ml-0.5`}>!</span>
        )}

        {/* Walk indicators (@wd/@wu) - directly after chord */}
        {chord.walk && (
          <span className={`text-black font-bold ${fontSize} ml-0.5`}>
            {chord.walk === 'down' ? '↘' : '↗'}
          </span>
        )}
      </div>
    </div>
  );
}
