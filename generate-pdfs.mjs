import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = './pdfs';
const APP_URL = 'http://localhost:5173/musicchart/';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    inputDir: './songs-txt',
    fitToPage: true, // Default to fit-to-page
    twoColumnLayout: false,
    fontSize: 'normal',
    showHelp: false,
    fromJson: null,
    setlistName: null,
    listSetlists: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      config.showHelp = true;
    } else if (arg === '--fit-to-page') {
      config.fitToPage = true;
    } else if (arg === '--no-fit-to-page') {
      config.fitToPage = false;
    } else if (arg === '--two-columns') {
      config.twoColumnLayout = true;
    } else if (arg === '--list-setlists') {
      config.listSetlists = true;
    } else if (arg.startsWith('--font-size=')) {
      const size = arg.split('=')[1];
      if (['small', 'normal', 'medium', 'big'].includes(size)) {
        config.fontSize = size;
      } else {
        console.error(`Invalid font size: ${size}. Valid options: small, normal, medium, big`);
        process.exit(1);
      }
    } else if (arg.startsWith('--from-json=')) {
      config.fromJson = arg.split('=')[1];
    } else if (arg.startsWith('--setlist=')) {
      config.setlistName = arg.split('=')[1];
    } else if (!arg.startsWith('--')) {
      // First non-flag argument is the input directory
      config.inputDir = arg;
    }
  }

  return config;
}

function showHelp() {
  console.log(`
MusicChart PDF Generator
========================

Generate PDFs from .txt chord charts or JSON exports using the MusicChart web interface.

USAGE:
  node generate-pdfs.mjs [input-directory] [options]
  node generate-pdfs.mjs --from-json=FILE [options]

ARGUMENTS:
  input-directory       Directory containing .txt files (default: ./songs-txt)

OPTIONS:
  --from-json=FILE      Generate PDFs from exported JSON file
  --setlist=NAME        Generate PDFs only for specified setlist (with --from-json)
  --list-setlists       List all setlists in JSON file and exit (with --from-json)
  --fit-to-page         Fit entire chart to one page (DEFAULT)
  --no-fit-to-page      Allow charts to span multiple pages
  --two-columns         Use two-column layout for printing
  --font-size=SIZE      Set font size: small, normal, medium, big (default: normal)
  -h, --help            Show this help message

EXAMPLES:
  # Generate PDFs from .txt files with default settings
  node generate-pdfs.mjs

  # Use a different input directory
  node generate-pdfs.mjs ./my-songs

  # Generate PDFs from JSON export (all setlists)
  node generate-pdfs.mjs --from-json=musicchart-backup.json

  # Generate PDFs for a specific setlist only
  node generate-pdfs.mjs --from-json=backup.json --setlist="Live Gig"

  # List all setlists in a JSON file
  node generate-pdfs.mjs --from-json=backup.json --list-setlists

  # Allow multi-page charts with big font
  node generate-pdfs.mjs --no-fit-to-page --font-size=big

  # Use two columns and fit to page
  node generate-pdfs.mjs --two-columns --fit-to-page

PAGE BREAKS:
  Without --fit-to-page, a new page starts when content exceeds A4 height.
  Approximate line capacity per A4 page:
  - Normal font: ~35-40 lines of chart content
  - Small font:  ~45-50 lines of chart content
  - Medium font: ~30-35 lines of chart content
  - Big font:    ~25-30 lines of chart content

  Note: Each section header and metadata line counts. Comments and spacing also
  affect layout. Use --fit-to-page to guarantee single-page output.

FILE NAMING:
  .txt files can have any valid filename (including spaces). PDFs are named as:
  "Song Title - Key.pdf" based on Title and Key metadata in the file.

REQUIREMENTS:
  - Dev server must be running at http://localhost:5173/musicchart/
  - Run 'npm run dev' in another terminal before using this script

OUTPUT:
  PDFs are saved to: ./pdfs/
`);
}

// ============================================
// JSON HANDLING FUNCTIONS
// ============================================

/**
 * Convert a chart object to chord text format
 */
function chartToChordText(chart) {
  let text = '';

  // Add metadata
  if (chart.metadata.title) {
    text += `Title: ${chart.metadata.title}\n`;
  }
  if (chart.metadata.key) {
    text += `Key: ${chart.metadata.key}\n`;
  }
  if (chart.metadata.tempo) {
    text += `Tempo: ${chart.metadata.tempo}\n`;
  }
  if (chart.metadata.timeSignature) {
    text += `Meter: ${chart.metadata.timeSignature}\n`;
  }
  if (chart.metadata.style) {
    text += `Style: ${chart.metadata.style}\n`;
  }
  if (chart.metadata.feel) {
    text += `Feel: ${chart.metadata.feel}\n`;
  }
  if (chart.metadata.customProperties) {
    Object.entries(chart.metadata.customProperties).forEach(([key, value]) => {
      text += `$${key}: ${value}\n`;
    });
  }

  if (text) {
    text += '\n';
  }

  // Convert sections
  text += sectionsToChordText(chart.sections);

  return text;
}

/**
 * Convert sections array to chord text
 */
function sectionsToChordText(sections) {
  if (sections.length === 0) return '';

  return sections.map((section) => {
    const lines = [];

    // Section header
    lines.push(`${section.name}:`);

    // Use measureLines if available to preserve line structure
    if (section.measureLines && section.measureLines.length > 0) {
      section.measureLines.forEach((line) => {
        let lineText = '';

        // Handle repeat notation
        if (line.isRepeat) {
          const measuresText = line.measures.map(m => m.rawText || chordsToText(m.chords)).join(' ');
          const multiplier = line.repeatMultiplier ? `{${line.repeatMultiplier}}` : '';
          lineText = `  ||: ${measuresText} :||${multiplier}`;
        } else {
          // Regular line - join all measures with space
          lineText = '  ' + line.measures.map((measure) => {
            let text = measure.rawText || chordsToText(measure.chords);
            if (measure.comment) {
              text = text ? `${text} /${measure.comment}` : `//${measure.comment}`;
            }
            return text;
          }).filter(t => t).join(' ');
        }

        if (lineText.trim()) {
          lines.push(lineText);
        }
      });
    } else {
      // Fallback to old format if no measureLines
      section.measures.forEach((measure) => {
        let text = measure.rawText || chordsToText(measure.chords);
        if (measure.comment) {
          text = text ? `${text} /${measure.comment}` : `//${measure.comment}`;
        }
        if (text) {
          lines.push('  ' + text);
        }
      });
    }

    return lines.join('\n');
  }).join('\n\n');
}

function chordsToText(chords) {
  return chords.map(chord => {
    let text = chord.number;
    if (chord.beats) text += '.'.repeat(chord.beats);
    if (chord.accent) text += '!';
    return text;
  }).join(' ');
}

/**
 * Load and parse JSON export file
 */
function loadJsonData(filepath) {
  if (!fs.existsSync(filepath)) {
    console.error(`Error: JSON file '${filepath}' does not exist`);
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const data = JSON.parse(content);

    if (!data.charts || !data.setlists || !data.setlistItems) {
      console.error('Error: Invalid JSON format. Expected export data with charts, setlists, and setlistItems');
      process.exit(1);
    }

    return data;
  } catch (error) {
    console.error(`Error reading JSON file: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Get charts for a setlist in correct order
 */
function getChartsForSetlist(data, setlistId) {
  // Get all items for this setlist, sorted by order
  const items = data.setlistItems
    .filter(item => item.setlistId === setlistId)
    .sort((a, b) => a.order - b.order);

  // Get the charts in order
  const charts = [];
  for (const item of items) {
    const chart = data.charts.find(c => c.id === item.chartId);
    if (chart) {
      charts.push(chart);
    }
  }

  return charts;
}

/**
 * List all setlists in JSON data
 */
function listSetlists(data) {
  console.log('\nSetlists in JSON file:');
  console.log('======================\n');

  for (const setlist of data.setlists) {
    const chartCount = data.setlistItems.filter(item => item.setlistId === setlist.id).length;
    const defaultMarker = setlist.isDefault ? ' (Default)' : '';
    console.log(`- "${setlist.name}"${defaultMarker} (${chartCount} charts)`);
  }

  console.log();
}

const config = parseArgs();

if (config.showHelp) {
  showHelp();
  process.exit(0);
}

const SONGS_DIR = config.inputDir;

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Validate input directory
if (!fs.existsSync(SONGS_DIR)) {
  console.error(`Error: Directory '${SONGS_DIR}' does not exist`);
  console.log('\nUsage: node generate-pdfs.mjs [input-directory]');
  console.log('Example: node generate-pdfs.mjs ./songs-txt');
  process.exit(1);
}

async function generatePDF(chartData, browser, settings) {
  const page = await browser.newPage();

  try {
    // chartData can be either a filename (string) or an object with { content, title, key }
    let songContent, title, key;

    if (typeof chartData === 'string') {
      // Legacy: reading from file
      songContent = fs.readFileSync(path.join(SONGS_DIR, chartData), 'utf8');
      const titleMatch = songContent.match(/Title:\s*(.+)/);
      const keyMatch = songContent.match(/Key:\s*(.+)/);
      title = titleMatch ? titleMatch[1].trim() : chartData.replace('.txt', '');
      key = keyMatch ? keyMatch[1].trim() : 'C';
    } else {
      // New: direct chart object
      songContent = chartData.content;
      title = chartData.title;
      key = chartData.key;
    }

    console.log(`Generating PDF for: ${title} - ${key}`);

    // Navigate to the app
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });

    // Wait for the app to be ready
    await page.waitForSelector('textarea', { timeout: 10000 });

    // Give React time to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Apply settings by clicking buttons
    if (settings.twoColumnLayout) {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const twoColButton = buttons.find(btn => btn.textContent.includes('Col'));
        if (twoColButton && twoColButton.textContent.includes('1 Col')) {
          twoColButton.click();
        }
      });
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (settings.fitToPage) {
      await page.evaluate(() => {
        const checkbox = document.querySelector('input[type="checkbox"]');
        if (checkbox && !checkbox.checked) {
          checkbox.click();
        }
      });
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (settings.fontSize !== 'normal') {
      await page.evaluate((fontSize) => {
        const select = document.querySelector('select');
        if (select) {
          select.value = fontSize;
          const event = new Event('change', { bubbles: true });
          select.dispatchEvent(event);
        }
      }, settings.fontSize);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Fill in the textarea by simulating Load button click
    // First, create a file in the page context
    const contentLoaded = await page.evaluate((content) => {
      return new Promise((resolve) => {
        const textarea = document.querySelector('textarea');
        if (!textarea) {
          resolve({ success: false, error: 'Textarea not found' });
          return;
        }

        try {
          // Find the React Fiber node for the textarea
          const fiberKey = Object.keys(textarea).find(key =>
            key.startsWith('__reactFiber') ||
            key.startsWith('__reactInternalInstance')
          );

          if (fiberKey) {
            // Navigate up to find the props with onChange handler
            let fiber = textarea[fiberKey];
            let onChange = null;

            // Try to find onChange in memoizedProps or pendingProps
            while (fiber && !onChange) {
              if (fiber.memoizedProps?.onChange) {
                onChange = fiber.memoizedProps.onChange;
                break;
              }
              if (fiber.pendingProps?.onChange) {
                onChange = fiber.pendingProps.onChange;
                break;
              }
              fiber = fiber.return;
            }

            if (onChange) {
              // Create synthetic event that matches React's expected format
              const syntheticEvent = {
                target: { value: content },
                currentTarget: { value: content },
                preventDefault: () => {},
                stopPropagation: () => {},
                nativeEvent: new Event('change'),
                bubbles: true,
                cancelable: true,
                defaultPrevented: false,
                isTrusted: true
              };

              // Set the value first
              textarea.value = content;

              // Call onChange with the synthetic event
              onChange(syntheticEvent);

              resolve({ success: true, method: 'react-fiber' });
              return;
            }
          }

          // Fallback method: use native value setter and dispatch events
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          ).set;
          nativeInputValueSetter.call(textarea, content);

          const inputEvent = new Event('input', { bubbles: true });
          textarea.dispatchEvent(inputEvent);

          // Small delay for React to process
          setTimeout(() => {
            resolve({ success: true, method: 'native' });
          }, 100);

        } catch (error) {
          resolve({ success: false, error: error.message });
        }
      });
    }, songContent);

    if (!contentLoaded.success) {
      throw new Error(`Failed to load content into textarea: ${contentLoaded.error}`);
    }

    console.log(`  Content loaded using method: ${contentLoaded.method}`);

    // Wait for React to parse and render the content
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Wait for specific chord elements to appear (indicating full render)
    await page.waitForFunction(
      () => {
        // Look for chord cells or section headers which indicate parsed content
        const sections = document.querySelectorAll('[class*="section"]');
        const chordCells = document.querySelectorAll('[class*="chord"]');
        const hasSections = sections.length > 0 || chordCells.length > 0;

        // Also check that the preview area has actual structured content
        const chordDisplays = Array.from(document.querySelectorAll('.bg-white.rounded-lg.shadow-md.p-6'));
        const previewDiv = chordDisplays.find(el => !el.classList.contains('no-print'));

        if (!previewDiv) return false;

        // Check for rendered chord display elements
        const hasChordDisplay = previewDiv.querySelector('[class*="flex"]') ||
                               previewDiv.querySelector('[class*="grid"]') ||
                               previewDiv.querySelector('h3') ; // Section headers

        return hasChordDisplay;
      },
      { timeout: 10000 }
    ).catch(() => {
      console.log('  Warning: Timeout waiting for chord elements, continuing anyway...');
    });

    // Verify content has been rendered
    const contentRendered = await page.evaluate((expectedTitle, expectedKey) => {
      // Check PrintHeader for metadata
      const printHeader = document.querySelector('.print\\:block');
      if (!printHeader) return { success: false, reason: 'PrintHeader not found' };

      const h1 = printHeader.querySelector('h1');
      if (!h1 || !h1.textContent.includes(expectedTitle)) {
        return { success: false, reason: `Title not found. Expected: ${expectedTitle}, Got: ${h1?.textContent}` };
      }

      // Check if chord content is rendered
      const chordDisplay = Array.from(document.querySelectorAll('.bg-white.rounded-lg.shadow-md.p-6'))
        .find(el => !el.classList.contains('no-print'));

      if (!chordDisplay) {
        return { success: false, reason: 'Chord display not found' };
      }

      const contentLength = chordDisplay.textContent.trim().length;
      const hasContent = contentLength > 50; // Lowered threshold for shorter songs

      if (!hasContent) {
        return {
          success: false,
          reason: `Chord display is empty or too short. Length: ${contentLength}, Content: ${chordDisplay.textContent.substring(0, 500)}`
        };
      }

      // Also verify we have actual structure (sections, chord cells, etc.)
      const hasSections = chordDisplay.querySelector('h3') !== null;
      const hasChordElements = chordDisplay.querySelector('[class*="flex"]') !== null ||
                              chordDisplay.querySelector('[class*="grid"]') !== null;

      return {
        success: true,
        details: `Length: ${contentLength}, Sections: ${hasSections}, ChordElements: ${hasChordElements}`
      };
    }, title, key);

    console.log(`  Verification: ${contentRendered.success ? `OK (${contentRendered.details || ''})` : contentRendered.reason}`);

    if (!contentRendered.success) {
      throw new Error(`Content rendering failed: ${contentRendered.reason}`);
    }

    // Extra wait for all rendering to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Set document title for PDF (matching web interface behavior)
    await page.evaluate((pdfTitle) => {
      document.title = pdfTitle;
    }, `${title} - ${key}`);

    // Generate PDF with same settings as print media query
    const pdfFilename = `${title.replace(/[/\\?%*:|"<>]/g, '-')} - ${key}.pdf`;
    await page.pdf({
      path: path.join(OUTPUT_DIR, pdfFilename),
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1.5cm',
        right: '1.5cm',
        bottom: '1.5cm',
        left: '1.5cm'
      },
      preferCSSPageSize: false
    });

    console.log(`✓ Created: ${pdfFilename}`);
  } catch (error) {
    console.error(`✗ Error processing ${songFile}:`, error.message);
    throw error;
  } finally {
    await page.close();
  }
}

async function generateAllPDFs() {
  console.log('Starting PDF generation...');
  console.log(`Input directory: ${SONGS_DIR}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Settings: fit-to-page=${config.fitToPage}, two-columns=${config.twoColumnLayout}, font-size=${config.fontSize}\n`);

  // Read all .txt files from the specified directory
  const files = fs.readdirSync(SONGS_DIR)
    .filter(file => file.endsWith('.txt'));

  if (files.length === 0) {
    console.log(`No .txt files found in ${SONGS_DIR}`);
    return;
  }

  console.log(`Found ${files.length} song file(s)\n`);

  // Launch browser once for all PDFs
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Process each file sequentially
    for (const file of files) {
      await generatePDF(file, browser, {
        fitToPage: config.fitToPage,
        twoColumnLayout: config.twoColumnLayout,
        fontSize: config.fontSize
      });
    }

    console.log('\n✓ All PDFs generated successfully!');
    console.log(`PDFs saved to: ${OUTPUT_DIR}/`);
  } finally {
    await browser.close();
  }
}

async function generatePDFsFromJson() {
  console.log('Starting PDF generation from JSON...');
  console.log(`JSON file: ${config.fromJson}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Settings: fit-to-page=${config.fitToPage}, two-columns=${config.twoColumnLayout}, font-size=${config.fontSize}\n`);

  // Load JSON data
  const data = loadJsonData(config.fromJson);

  // If --list-setlists, show list and exit
  if (config.listSetlists) {
    listSetlists(data);
    return;
  }

  // Determine which setlists to process
  let setlistsToProcess;
  if (config.setlistName) {
    // Find specific setlist
    const setlist = data.setlists.find(s => s.name === config.setlistName);
    if (!setlist) {
      console.error(`Error: Setlist "${config.setlistName}" not found`);
      console.log('\nAvailable setlists:');
      listSetlists(data);
      process.exit(1);
    }
    setlistsToProcess = [setlist];
    console.log(`Processing setlist: "${setlist.name}"\n`);
  } else {
    // Process all setlists
    setlistsToProcess = data.setlists;
    console.log(`Processing all ${setlistsToProcess.length} setlist(s)\n`);
  }

  // Launch browser once for all PDFs
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let totalGenerated = 0;

  try {
    // Process each setlist
    for (const setlist of setlistsToProcess) {
      const charts = getChartsForSetlist(data, setlist.id);

      if (charts.length === 0) {
        console.log(`⊘ Setlist "${setlist.name}" is empty, skipping\n`);
        continue;
      }

      console.log(`\n📋 Setlist: "${setlist.name}" (${charts.length} charts)`);
      console.log('─'.repeat(50));

      // Process each chart in the setlist
      for (const chart of charts) {
        const content = chartToChordText(chart);
        const chartData = {
          content,
          title: chart.metadata.title || 'Untitled',
          key: chart.metadata.key || 'C'
        };

        await generatePDF(chartData, browser, {
          fitToPage: config.fitToPage,
          twoColumnLayout: config.twoColumnLayout,
          fontSize: config.fontSize
        });

        totalGenerated++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✓ Generated ${totalGenerated} PDF(s) successfully!`);
    console.log(`PDFs saved to: ${OUTPUT_DIR}/`);
  } finally {
    await browser.close();
  }
}

// Run the script
if (config.fromJson) {
  generatePDFsFromJson().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else {
  generateAllPDFs().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
