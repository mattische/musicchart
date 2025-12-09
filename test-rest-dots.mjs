import { parseChordText } from './src/utils/jotChordParser.ts';

// Test parsing of (1. x.. <1><)
const testInput = `Test:
(1. x.. <1><)`;

console.log('Testing input:', testInput);
console.log('\n=== Parsing Result ===');

const result = parseChordText(testInput, 'C', true);
console.log(JSON.stringify(result, null, 2));

// Look at the specific chords in the first measure
if (result.sections[0]?.measures[0]?.chords) {
  console.log('\n=== First Measure Chords ===');
  result.sections[0].measures[0].chords.forEach((chord, idx) => {
    console.log(`Chord ${idx}:`, {
      number: chord.number,
      beats: chord.beats,
      isRest: chord.isRest,
      diamond: chord.diamond,
      push: chord.push
    });
  });
}
