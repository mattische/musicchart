// Import the parser to test
import { parseChordTextWithMetadata } from './src/utils/jotChordParser.ts';

const testInputs = [
  '1w',
  '(1e 2q)',
  '(<1> <2>)'
];

console.log('Testing parser:\n');

testInputs.forEach(input => {
  console.log(`Input: "${input}"`);
  try {
    const result = parseChordTextWithMetadata(`V:\n  ${input}`, true);
    const section = result.sections[0];
    if (section && section.measures[0]) {
      const chords = section.measures[0].chords;
      console.log(`  Parsed ${chords.length} chord(s):`);
      chords.forEach((chord, i) => {
        console.log(`    Chord ${i + 1}:`);
        console.log(`      number: "${chord.number}"`);
        console.log(`      diamond: ${chord.diamond}`);
        console.log(`      annotation: ${JSON.stringify(chord.annotation)}`);
        console.log(`      beats: ${chord.beats}`);
      });
    }
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
  console.log('');
});
