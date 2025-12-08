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
      <div className="relative inline-flex flex-col items-center justify-center min-w-[16px] self-end mb-3">
        <div className="w-2 h-2 bg-black rounded-full print:bg-black"></div>
      </div>
    );
  }

  // Handle repeat symbol (%)
  if (chord.number === '%') {
    return (
      <div className="relative inline-flex flex-col items-center min-w-[16px]">
        <span className={`${fontSize} font-bold text-black`}>%</span>
      </div>
    );
  }

  // Handle no chord / rest (X)
  if (chord.isRest || chord.number === 'X' || chord.number.startsWith('X_')) {
    return (
      <div className="relative inline-flex flex-col items-center min-w-[16px]">
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

  // Extract accidental (# or b) from the beginning
  const accidentalMatch = displayNumber.match(/^([#b])(.*)/);
  const accidental = accidentalMatch ? accidentalMatch[1] : '';
  const chordWithoutAccidental = accidentalMatch ? accidentalMatch[2] : displayNumber;

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

  // Render beat marks above the chord (vertical lines)
  const renderBeats = () => {
    if (!chord.beats || chord.beats === 0) return null;

    return (
      <div className="flex gap-0.5 justify-center mb-0.5">
        {Array.from({ length: chord.beats }).map((_, i) => (
          <span key={i} className="inline-block w-[2px] h-2 bg-black"></span>
        ))}
      </div>
    );
  };

  // Render note value above chord
  const renderNoteValue = () => {
    if (!chord.annotation?.value) return null;

    const symbol = getNoteSymbol(chord.annotation.value);
    // More space above diamond chords
    const marginClass = chord.diamond ? 'mb-2' : 'mb-1';

    return (
      <div className={`flex justify-center ${marginClass} ml-1`}>
        <span className="text-3xl text-gray-700 leading-none font-bold" style={{ fontFamily: "'Noto Music', sans-serif" }}>
          {symbol}
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
    <div className="relative inline-flex flex-col items-center min-w-[16px]">
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
          <span className="text-2xl text-black" style={{ fontFamily: "'Noto Music', sans-serif" }}>𝄐</span>
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
          <div className="inline-flex items-center">
            {accidental && (
              <span className="text-sm font-bold text-black mr-0.5 self-center">{accidental}</span>
            )}
            <span className="inline-block relative w-8 h-8 align-baseline">
              <span className="absolute inset-0 border-2 border-black bg-white transform rotate-45"></span>
              <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-black z-10">
                {chordWithoutAccidental}
              </span>
            </span>
          </div>
        ) : (
          <span className="inline-flex items-baseline">
            {accidental && (
              <span className="text-sm font-bold text-black mr-0.5">{accidental}</span>
            )}
            <span
              className={`${fontSize} font-bold text-black`}
              style={{
                borderBottom: hasUnderline ? '2px solid black' : '2px solid transparent',
                display: 'inline-block',
                paddingBottom: '0px'
              }}
            >
              {chordWithoutAccidental}
            </span>
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
