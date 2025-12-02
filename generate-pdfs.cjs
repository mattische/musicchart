const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SONGS_DIR = './songs-txt';
const OUTPUT_DIR = './pdfs';
const APP_URL = 'http://localhost:5173/musicchart/';

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generatePDF(songFile) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Read song file
    const songContent = fs.readFileSync(path.join(SONGS_DIR, songFile), 'utf8');

    // Extract title and key from content
    const titleMatch = songContent.match(/Title:\s*(.+)/);
    const keyMatch = songContent.match(/Key:\s*(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : songFile.replace('.txt', '');
    const key = keyMatch ? keyMatch[1].trim() : 'C';

    console.log(`Generating PDF for: ${title} - ${key}`);

    // Navigate to the app
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });

    // Wait for textarea to be available
    await page.waitForSelector('textarea');

    // Fill in the textarea with song content
    await page.evaluate((content) => {
      const textarea = document.querySelector('textarea');
      textarea.value = content;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }, songContent);

    // Wait for rendering to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate PDF
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
      }
    });

    console.log(`✓ Created: ${pdfFilename}`);
  } catch (error) {
    console.error(`✗ Error processing ${songFile}:`, error.message);
  } finally {
    await browser.close();
  }
}

async function generateAllPDFs() {
  console.log('Starting PDF generation...\n');

  // Read all .txt files from songs-txt directory
  const files = fs.readdirSync(SONGS_DIR)
    .filter(file => file.endsWith('.txt'));

  console.log(`Found ${files.length} song files\n`);

  // Process each file sequentially
  for (const file of files) {
    await generatePDF(file);
  }

  console.log('\n✓ All PDFs generated successfully!');
  console.log(`PDFs saved to: ${OUTPUT_DIR}/`);
}

// Run the script
generateAllPDFs().catch(console.error);
