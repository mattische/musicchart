import { parseChordTextWithMetadata } from './src/utils/jotChordParser.ts';

const tests = [
  { name: 'Test 1', input: '#5-...' },
  { name: 'Test 2', input: '#5m...' },
  { name: 'Test 3', input: 'b7-w' },
  { name: 'Test 4', input: 'b7mw' },
  { name: 'Test 5', input: '(#5m... b7-)' },
  { name: 'Test 6', input: '#5-..._b7m.' },
  { name: 'Test 7', input: '(#5m.. b7m. <#4>w)' },
  { name: 'Test 8', input: '#5-...!' },
  { name: 'Test 9', input: 'b7m...<' },
  { name: 'Test 10', input: '#5-...= b7m' },
];

console.log('Testing Complex Modifier Combinations:\n');

tests.forEach(test => {
  console.log(`\n${test.name}: ${test.input}`);
  console.log('='.repeat(50));

  const result = parseChordTextWithMetadata(`Section:\n${test.input}`, true);

  if (result.sections.length > 0 && result.sections[0].measures.length > 0) {
    result.sections[0].measures.forEach((measure, idx) => {
      console.log(`  Measure ${idx + 1}:`);
      console.log(`    Raw: ${measure.rawText}`);
      console.log(`    Is Split Bar: ${measure.isSplitBar}`);

      measure.chords.forEach((chord, cidx) => {
        console.log(`    Chord ${cidx + 1}:`, {
          number: chord.number,
          beats: chord.beats,
          noteValue: chord.annotation?.value,
          diamond: chord.diamond,
          accent: chord.accent,
          push: chord.push,
          tie: chord.tie,
        });
      });
    });
  } else {
    console.log('  ERROR: No measures parsed');
  }
});
