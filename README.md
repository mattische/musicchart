# MusicChart

A Progressive Web App for writing music charts using the Nashville Number System with JotChord syntax.

## Features

- Text-based editor with JotChord syntax
- Nashville Number System (1-7) with chord name conversion
- Two-column layout option
- PWA support for offline use
- Responsive design
- PDF export via print
- Local storage persistence

## Installation

### Local development

```bash
# Clone the repository
git clone https://github.com/mattische/musicchart.git
cd musicchart

# Install dependencies
npm install

# Start development server
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

## Nashville Number System

The Nashville Number System uses scale degrees instead of chord names, making it easy to transpose songs.

**Example in C major:**
- 1 = C
- 2- = Dm
- 3- = Em
- 4 = F
- 5 = G
- 6- = Am
- 7o = Bdim

**Same song in G major:**
- 1 = G
- 2- = Am
- 3- = Bm
- 4 = C
- 5 = D
- 6- = Em
- 7o = F#dim

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Vite PWA Plugin

## Contributing

Contributions are welcome. Open an issue or submit a pull request.

## License

MIT

## Inspiration

- [1Chart](https://www.1chartapp.com/)
- [JotChord](https://www.jotchord.com/)
- [Nashville Numbers App](https://www.nashvillenumbersapp.com/)
