import { Chord } from '../types/song';
import { nashvilleToChord } from '../utils/chordConverter';

interface ChordDisplayProps {
  chord: Chord;
  nashvilleMode: boolean;
  songKey: string;
  fontSize?: string;
}

export default function ChordDisplay({ chord, nashvilleMode, songKey, fontSize = 'text-2xl' }: ChordDisplayProps) {
  // Get separator dot size based on font size
  const getSeparatorSize = () => {
    if (fontSize.includes('text-[20rem]')) return 'w-10 h-10';    // gigantic
    if (fontSize.includes('text-[16rem]')) return 'w-8 h-8';      // enormous
    if (fontSize.includes('text-[13rem]')) return 'w-7 h-7';      // colossal
    if (fontSize.includes('text-[10rem]')) return 'w-6 h-6';      // massive
    if (fontSize.includes('text-[8rem]')) return 'w-5 h-5';       // giant
    if (fontSize.includes('text-[6rem]')) return 'w-4 h-4';       // huge
    if (fontSize.includes('text-[4.5rem]')) return 'w-3.5 h-3.5'; // big
    if (fontSize.includes('text-[3rem]')) return 'w-3 h-3';       // medium
    return 'w-2 h-2';                                              // normal and below
  };

  // Get beat mark size based on font size
  const getBeatMarkSize = () => {
    if (fontSize.includes('text-[20rem]')) return { width: 'w-3', height: 'h-12' };     // gigantic
    if (fontSize.includes('text-[16rem]')) return { width: 'w-2.5', height: 'h-10' };   // enormous
    if (fontSize.includes('text-[13rem]')) return { width: 'w-2', height: 'h-8' };      // colossal
    if (fontSize.includes('text-[10rem]')) return { width: 'w-1.5', height: 'h-7' };    // massive
    if (fontSize.includes('text-[8rem]')) return { width: 'w-1.5', height: 'h-6' };     // giant
    if (fontSize.includes('text-[6rem]')) return { width: 'w-1', height: 'h-5' };       // huge
    if (fontSize.includes('text-[4.5rem]')) return { width: 'w-1', height: 'h-4' };     // big
    if (fontSize.includes('text-[3rem]')) return { width: 'w-0.5', height: 'h-3' };     // medium
    return { width: 'w-[2px]', height: 'h-2' };                                          // normal and below
  };

  // Get note value size based on font size
  const getNoteValueSize = () => {
    if (fontSize.includes('text-[20rem]')) return 'text-[12rem]';   // gigantic
    if (fontSize.includes('text-[16rem]')) return 'text-[10rem]';   // enormous
    if (fontSize.includes('text-[13rem]')) return 'text-[8rem]';    // colossal
    if (fontSize.includes('text-[10rem]')) return 'text-[6rem]';    // massive
    if (fontSize.includes('text-[8rem]')) return 'text-[5rem]';     // giant
    if (fontSize.includes('text-[6rem]')) return 'text-[4rem]';     // huge
    if (fontSize.includes('text-[4.5rem]')) return 'text-[3rem]';   // big
    if (fontSize.includes('text-[3rem]')) return 'text-5xl';        // medium
    return 'text-3xl';                                               // normal and below
  };

  // Get diamond size based on font size
  const getDiamondSize = () => {
    if (fontSize.includes('text-[20rem]')) return { box: 'w-[20rem] h-[20rem]', text: 'text-[14rem]' };  // gigantic
    if (fontSize.includes('text-[16rem]')) return { box: 'w-[16rem] h-[16rem]', text: 'text-[11rem]' };  // enormous
    if (fontSize.includes('text-[13rem]')) return { box: 'w-[13rem] h-[13rem]', text: 'text-[9rem]' };   // colossal
    if (fontSize.includes('text-[10rem]')) return { box: 'w-[10rem] h-[10rem]', text: 'text-[7rem]' };   // massive
    if (fontSize.includes('text-[8rem]')) return { box: 'w-[8rem] h-[8rem]', text: 'text-[5.5rem]' };    // giant
    if (fontSize.includes('text-[6rem]')) return { box: 'w-[6rem] h-[6rem]', text: 'text-[4rem]' };      // huge
    if (fontSize.includes('text-[4.5rem]')) return { box: 'w-[4.5rem] h-[4.5rem]', text: 'text-[3rem]' };// big
    if (fontSize.includes('text-[3rem]')) return { box: 'w-[3rem] h-[3rem]', text: 'text-2xl' };         // medium
    return { box: 'w-8 h-8', text: 'text-sm' };                                                           // normal and below
  };

  // Handle separator (*)
  if (chord.number === '*') {
    return (
      <div className="relative inline-flex flex-col items-center justify-center min-w-[16px] self-end mb-3">
        <div className={`${getSeparatorSize()} bg-black dark:bg-white rounded-full print:bg-black`}></div>
      </div>
    );
  }

  // Handle repeat symbol (%)
  if (chord.number === '%') {
    return (
      <div className="relative inline-flex flex-col items-center min-w-[16px]">
        <span className={`${fontSize} font-bold text-black dark:text-white print:text-black`}>%</span>
      </div>
    );
  }

  // Handle no chord / rest (X or x) - but allow beats/dots above
  const isRestChord = chord.isRest || chord.number.toUpperCase() === 'X' || chord.number.toUpperCase().startsWith('X_');
  if (isRestChord && !chord.beats) {
    return (
      <div className="relative inline-flex flex-col items-center min-w-[16px]">
        <span className={`${fontSize} font-bold text-black dark:text-white print:text-black`}>{chord.number.toUpperCase()}</span>
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
    const beatSize = getBeatMarkSize();

    return (
      <div className="flex gap-0.5 justify-center mb-0.5">
        {Array.from({ length: chord.beats }).map((_, i) => (
          <span key={i} className={`inline-block ${beatSize.width} ${beatSize.height} bg-black dark:bg-white print:bg-black`}></span>
        ))}
      </div>
    );
  };

  // Render note value above chord
  const renderNoteValue = () => {
    if (!chord.annotation?.value) return null;

    const symbol = getNoteSymbol(chord.annotation.value);
    const noteSize = getNoteValueSize();
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
          className={`${noteSize} text-gray-700 dark:text-gray-300 print:text-gray-700 leading-none font-bold`}
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
        <span className="text-black dark:text-white print:text-black font-bold text-lg">
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
          <span className="text-2xl text-black dark:text-white print:text-black leading-none" style={{ fontFamily: "'Noto Music', sans-serif" }}>𝄐</span>
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
          <span className="text-[0.65rem] text-gray-600 dark:text-gray-400 print:text-gray-600 font-normal leading-none">
            mod{chord.modulation > 0 ? '+' : ''}{chord.modulation}
          </span>
        </div>
      )}

      {/* Inline comment above chord */}
      {chord.inlineComment && (
        <div className="flex justify-center mb-0.5">
          <span className="text-xs text-gray-600 dark:text-gray-400 print:text-gray-600 italic">
            {chord.inlineComment}
          </span>
        </div>
      )}

      {/* Chord */}
      <div className="relative px-1 flex items-center">
        {/* Ending number before chord (shown as circle) - positioned absolutely */}
        {chord.ending && (
          <span className="absolute -left-6 top-0 inline-flex items-center justify-center w-5 h-5 border-2 border-black dark:border-white print:border-black rounded-full text-xs font-extrabold text-black dark:text-white print:text-black">
            {chord.ending}
          </span>
        )}

        {/* Diamond (whole note) or regular chord */}
        {chord.diamond ? (
          <div className="inline-flex items-center">
            <span className={`inline-block relative ${getDiamondSize().box} align-baseline`}>
              <span className="absolute inset-0 border-2 border-black dark:border-white print:border-black bg-white dark:bg-gray-800 print:bg-white transform rotate-45"></span>
              <span className={`absolute inset-0 flex items-center justify-center ${getDiamondSize().text} text-black dark:text-white print:text-black z-10`}>
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
              <span className={`${fontSize} font-semibold italic text-black dark:text-white print:text-black self-start`} style={{ transform: 'scaleX(0.8)' }}>{accidental}</span>
            )}
            <span
              className={`${fontSize} text-black dark:text-white print:text-black inline-flex items-baseline`}
              style={{
                borderBottom: hasUnderline ? '2px solid currentColor' : '2px solid transparent',
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
          <span className={`text-black dark:text-white print:text-black font-bold ${fontSize} ml-0.5`}>=</span>
        )}

        {/* Accent mark (!) - directly after chord */}
        {chord.accent && (
          <span className={`text-black dark:text-white print:text-black font-bold ${fontSize} ml-0.5`}>!</span>
        )}

        {/* Walk indicators (@wd/@wu) - directly after chord */}
        {chord.walk && (
          <span className={`text-black dark:text-white print:text-black font-bold ${fontSize} ml-0.5`}>
            {chord.walk === 'down' ? '↘' : '↗'}
          </span>
        )}
      </div>
    </div>
  );
}
