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

  // Handle no chord / rest (X or x) - but allow beats/dots above
  const isRestChord = chord.isRest || chord.number.toUpperCase() === 'X' || chord.number.toUpperCase().startsWith('X_');
  if (isRestChord && !chord.beats) {
    return (
      <div className="relative inline-flex flex-col items-center min-w-[16px]">
        <span className={`${fontSize} font-bold text-black`}>{chord.number.toUpperCase()}</span>
      </div>
    );
  }

  let displayNumber = nashvilleMode
    ? chord.number
    : nashvilleToChord(chord.number, songKey as any);

  // For rest chords, ensure uppercase X
  if (isRestChord) {
    displayNumber = displayNumber.toUpperCase();
  }

  // Check if chord has underline and remove underscore from display
  const hasUnderline = displayNumber.includes('_');
  if (hasUnderline) {
    displayNumber = displayNumber.replace(/_/g, '');
  }

  // Extract accidental (# or b) from the beginning
  const accidentalMatch = displayNumber.match(/^([#b])(.*)/);
  const accidental = accidentalMatch ? accidentalMatch[1] : '';
  const chordWithoutAccidental = accidentalMatch ? accidentalMatch[2] : displayNumber;

  // Extract quality markers (m should be rendered lighter, - is rendered normal)
  // Pattern: base (number or letter) + optional quality (m, -, +, o, ^, M) + optional extensions
  const qualityMatch = chordWithoutAccidental.match(/^([A-HX\d]+)(m|[-+o^M])?(.*)/i);
  const baseNumber = qualityMatch ? qualityMatch[1] : chordWithoutAccidental;
  const quality = qualityMatch ? qualityMatch[2] : '';
  const extensions = qualityMatch ? qualityMatch[3] : '';

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

    // Scale adjustments for consistent note sizes
    // Half note (h), sixteenth note (s), and 32nd note (t) are naturally larger
    const getScale = (value: string) => {
      switch (value) {
        case 'h': return 0.75;  // Half note - scale down more
        case 's': return 0.75;  // Sixteenth note - scale down more
        case 't': return 0.75;  // 32nd note - scale down more
        default: return 1.0;
      }
    };

    // Vertical adjustment for scaled notes to align them better with chords
    const getTransform = (value: string) => {
      const scale = getScale(value);
      // Move scaled-down notes slightly down
      const translateY = scale < 1.0 ? 'translateY(15%)' : '';
      return `scale(${scale}) ${translateY}`.trim();
    };

    return (
      <div className={`flex justify-center ${marginClass}`}>
        <span
          className="text-3xl text-gray-700 leading-none font-bold"
          style={{
            fontFamily: "'Noto Music', sans-serif",
            transform: getTransform(chord.annotation.value),
            display: 'inline-block'
          }}
        >
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
    <div className={`relative inline-flex flex-col items-center min-w-[16px] ${chord.ending ? 'ml-8' : ''}`}>
      {/* Fermata above chord */}
      {chord.fermata && (
        <div className="flex justify-center mb-0">
          <span className="text-2xl text-black leading-none" style={{ fontFamily: "'Noto Music', sans-serif" }}>𝄐</span>
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
          <span className="text-[0.65rem] text-gray-600 font-normal leading-none">
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
        {/* Ending number before chord (shown as circle) - positioned absolutely */}
        {chord.ending && (
          <span className="absolute -left-6 top-0 inline-flex items-center justify-center w-5 h-5 border-2 border-black rounded-full text-xs font-extrabold text-black">
            {chord.ending}
          </span>
        )}

        {/* Diamond (whole note) or regular chord */}
        {chord.diamond ? (
          <div className="inline-flex items-center">
            <span className="inline-block relative w-8 h-8 align-baseline">
              <span className="absolute inset-0 border-2 border-black bg-white transform rotate-45"></span>
              <span className="absolute inset-0 flex items-center justify-center text-sm text-black z-10">
                {accidental && (
                  <span className="font-semibold italic mr-0.5" style={{ transform: 'scaleX(0.8)' }}>{accidental}</span>
                )}
                <span className="font-bold">{baseNumber}</span>
                {quality && (
                  <span className={quality === 'm' ? 'font-normal' : 'font-bold'}>{quality}</span>
                )}
                {extensions && <span className="font-bold">{extensions}</span>}
              </span>
            </span>
          </div>
        ) : (
          <span className="inline-flex items-baseline">
            {accidental && (
              <span className={`${fontSize} font-semibold italic text-black self-start`} style={{ transform: 'scaleX(0.8)' }}>{accidental}</span>
            )}
            <span
              className={`${fontSize} text-black inline-flex items-baseline`}
              style={{
                borderBottom: hasUnderline ? '2px solid black' : '2px solid transparent',
                paddingBottom: '0px'
              }}
            >
              <span className="font-bold">{baseNumber}</span>
              {quality && (
                <span className={quality === 'm' ? 'font-normal' : 'font-bold'}>{quality}</span>
              )}
              {extensions && <span className="font-bold">{extensions}</span>}
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
