# MusicChart - Nashville Number System PWA

En modern, enkel och kraftfull Progressive Web App för att skriva musikdiagram enligt Nashville Number System-standarden.

## Features

⌨️ **Textbaserad Editor** - Skriv ackord snabbt med tangentbordet, precis som i ett dokument
🎼 **Smart Syntax** - Använd punkter för beats (`1...`), utropstecken för accenter (`4!`)
🔄 **Nashville ↔️ Chord Toggle** - Växla smidigt mellan Nashville Number (1-7) och vanliga ackordnamn (C, D, Em)
⬅️➡️ **Tangentbordsnavigering** - Navigera mellan takter med piltangenter eller Enter
📰 **Två-kolumn Layout** - Optimera för utskrift med två-kolumn vy
💾 **PWA Support** - Installera som app på mobil, platta eller dator - fungerar offline
📱 **Responsiv** - Fungerar perfekt på alla enheter
🎹 **Komplett Metadata** - Titel, tonart, tempo, taktart

## Installation

### Lokal utveckling

```bash
# Klona projektet
git clone https://github.com/yourusername/musicchart.git
cd musicchart

# Installera dependencies
npm install

# Starta utvecklingsserver
npm run dev
```

Appen körs nu på `http://localhost:5173`

### Build för produktion

```bash
npm run build
```

### Deploy till GitHub Pages

```bash
npm run deploy
```

## Användning

1. **Skapa en ny låt**
   - Fyll i metadata (titel, tonart, tempo, taktart)
   - Lägg till sektioner (Verse, Chorus, Bridge, etc.)

2. **Skriv ackord med tangentbordet**
   - Klicka i en takt och skriv direkt
   - Exempel: `1 4 5 1` (fyra ackord)
   - Använd **mellanslag** för att separera ackord

3. **Använd smart syntax**
   ```
   1...     → Ackord 1 med 3 beats (punkter = beats)
   4!       → Ackord 4 med accent (!)
   5-.      → Ackord 5 moll med 1 beat
   2sus4!.. → Ackord 2sus4 med accent och 2 beats
   ```

4. **Navigera med tangentbordet**
   - **→ / ←** : Flytta mellan takter (höger/vänster)
   - **↑ / ↓** : Flytta upp/ner i kolumner
   - **Enter** : Flytta till nästa takt nedåt
   - **→** (sista takten): Skapar ny takt automatiskt

5. **Växla mellan lägen**
   - **Nashville (123)**: Använd siffror (1, 2-, 4, 5)
   - **Chords (ABC)**: Se ackordnamn (C, Dm, F, G)
   - Konverteras automatiskt baserat på vald tonart

6. **Optimera för utskrift**
   - Klicka **"2 Columns"** för två-kolumn layout
   - Perfekt för att få hela låten på en sida

7. **Spara och exportera**
   - Spara: Lagras lokalt i webbläsaren (kommer snart)
   - PDF: Exportera som PDF (kommer snart)

## Tekniker

- **React 18** - UI framework
- **TypeScript** - Typsäkerhet
- **Vite** - Build tool och dev server
- **Tailwind CSS** - Styling
- **Vite PWA Plugin** - Progressive Web App support
- **IndexedDB** - Lokal datalagring (kommer snart)

## Syntax-guide

### Grundläggande ackord
```
1        → Durackord på första skalsteget
2-       → Mollackord på andra skalsteget (- eller m för moll)
4sus4    → Sus4-ackord
5**7     → Septimackord
#5       → Höjd kvint (icke-diatonisk)
b7       → Sänkt sjua
```

### Beats och rytm
```
1.       → 1 beat
1..      → 2 beats
1...     → 3 beats
1....    → 4 beats
```

### Accent marks
```
4!       → Accent på ackord 4
1...!    → 3 beats med accent
```

### Kombinationer
```
1 4 5 1          → Fyra ackord, en takt per ackord
1... 5           → Ackord 1 i 3 beats, sedan 5
4! 5 1           → Accent på 4, sedan 5 och 1
2-.. 5! 1.       → 2 moll (2 beats), 5 med accent, 1 (1 beat)
```

## Nashville Number System

Nashville Number System är ett sätt att skriva ackord baserat på skalsteg istället för specifika ackordnamn. Detta gör det enkelt att transponera låtar till olika tonarter.

**Exempel i C-dur:**
- 1 = C
- 2- = Dm (- betyder moll)
- 3- = Em
- 4 = F
- 5 = G
- 6- = Am
- 7dim = Bdim

**Samma i G-dur:**
- 1 = G
- 2- = Am
- 3- = Bm
- 4 = C
- 5 = D
- 6- = Em
- 7dim = F#dim

## Bidra

Bidrag är välkomna! Öppna en issue eller skicka en pull request.

## Licens

MIT

## Inspiration

Inspirerad av:
- [1Chart](https://www.1chartapp.com/)
- [JotChord](https://www.jotchord.com/)
- [Nashville Numbers App](https://www.nashvillenumbersapp.com/)
