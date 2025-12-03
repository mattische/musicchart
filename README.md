# MusicChart

This is for writing music charts on the go.
Using the Nashville Number System with JotChord syntax.

## Features

- Text-based editor with JotChord syntax
- NNS (1-7) with chord name conversion
- PWA support for offline use
- Responsive design
- PDF export
- Local storage persistence

## Installation

### Local development

```bash
# Clone this repo
cd musicchart

# dependencies
npm install

# dev server
npm run dev
```

Open `http://localhost:5173`

### Build for production

```bash
npm run build
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

## Usage

The editor uses JotChord syntax. Write chord charts in the left panel and see the rendered output in the right panel.

### Metadata

```
Title: Song Name
Key: C
Tempo: 120
Meter: 4/4
Style: Rock
$Artist: Artist Name
```

### Sections

```
V1:
    1 4 5 1
    2- 5 1

CHORUS:
    4 5 6- 1
    4 5 1
```

### Basic chords

```
1        → Major chord
2-       → Minor chord (- or m)
4sus4    → Sus4 chord
5**7     → Seventh chord
#5       → Sharp five
b7       → Flat seven
```

### Rhythm notation

```
1.       → 1 beat
1..      → 2 beats
1...     → 3 beats
<1>      → Diamond (whole note)
1_6-     → Split bar
```

### Annotations

```
4!       → Accent
1=       → Tie
<1>~     → Fermata
4e       → Eighth note
1w       → Whole note
2@wd     → Walk down
```

### Repeats

```
||: 1 4 5 1 :||        → Standard repeat
||: 1 4 :||{4}         → Repeat 4 times
%                      → Multi-measure repeat
1[2 4 5]               → Ending 1
```

### Comments

```
// Line comment
/* Block comment */
1/*inline*/            → Inline comment
```


## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Vite PWA Plugin

## License

MIT

## Inspiration

- [1Chart](https://www.1chartapp.com/)
- [JotChord](https://www.jotchord.com/)
- [Nashville Numbers App](https://www.nashvillenumbersapp.com/)
