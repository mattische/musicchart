# MusicChart

This is for writing music charts on the go.
Using the Nashville Number System with JotChord syntax.

- Text-based editor with JotChord syntax
- NNS (1-7) with chord name conversion
- PWA support for offline use
- PDF export
- A cli tool to generate charts from txt to pdf

## TODO/wishlist
- metronome (visual)
- better rendering of diamonds and ties


## Installation, use locally

```bash
# Clone this repo
cd musicchart

# dependencies
npm install

# dev server
npm run dev
```

follow the url shown in the terminal

### Build 

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
Tempo: 180
Meter: 4/4
Style: Rock
Feel: Swing
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

## CLI tool for pdf generation

  Generate PDFs from `.txt` chord chart files using the cli script.

  > [!TIP]
  >
  >  *PAGE BREAKS:*
  >
  > Without --fit-to-page, a new page starts when content exceeds A4 height.
  >
  > Approximate line capacity per A4 page (in a txt-file):
  >
  > - Normal font: ~35-40 lines of chart content
  > - Small font:  ~45-50 lines of chart content
  > - Medium font: ~30-35 lines of chart content
  > - Big font:    ~25-30 lines of chart content

  Example files is located in ```songs-txt``` and in ```pdfs``` directories.

  ### Requirements

  The dev server must be running, so you must first clone this repo and install requirements.
  
  Then:

  ```bash
  npm run dev

  Basic Usage

  # Generate pdf's with default settings (fit-to-page enabled)
  # Looks for a directory named 'songs-txt' with .txt files with charts
  node generate-pdfs.mjs

  # Use a different input directory
  node generate-pdfs.mjs ./my-songs

  # View all options
  node generate-pdfs.mjs --help

  Options

  - --fit-to-page - Fit entire chart to one page (this is default!)
  - --no-fit-to-page - Allow charts to span multiple pages
  - --two-columns - Use two-column layout
  - --font-size=SIZE - Set font size: small, normal, medium, big

  Examples

  # Multi-page charts with big font
  node generate-pdfs.mjs --no-fit-to-page --font-size=big

  # Two columns with small font
  node generate-pdfs.mjs --two-columns --font-size=small

  PDFs are saved to ./pdfs/ with filenames based on song metadata: "Song Title - Key.pdf"
  ```

  ### Generate PDFs from JSON exports

  You can also generate PDFs from exported JSON files (created via Settings → Export All Data in the app).

  ```bash
  # Generate PDFs from all setlists in a JSON export
  node generate-pdfs.mjs --from-json=musicchart-backup.json

  # List all setlists in the JSON file
  node generate-pdfs.mjs --from-json=backup.json --list-setlists

  # Generate PDFs for a specific setlist only
  node generate-pdfs.mjs --from-json=backup.json --setlist="Live Gig"

  # Combine with other options
  node generate-pdfs.mjs --from-json=backup.json --setlist="My Band" --font-size=big
  ```

  **Benefits of using JSON exports:**
  - Preserve all your charts and setlists in one file
  - Generate PDFs for specific setlists only
  - Charts are automatically generated in the correct setlist order
  - Easy to organize and batch-process multiple gigs
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
