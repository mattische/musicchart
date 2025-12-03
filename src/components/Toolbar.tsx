import { Song } from '../types/song';
import { sectionsToChordText } from '../utils/jotChordParser';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ToolbarProps {
  nashvilleMode: boolean;
  onToggleMode: () => void;
  twoColumnLayout: boolean;
  onToggleTwoColumn: () => void;
  fitToPage: boolean;
  onToggleFitToPage: () => void;
  song: Song;
  onNewSong: () => void;
  onLoadFile: (text: string) => void;
  fontSize: string;
  onFontSizeChange: (size: string) => void;
}

export default function Toolbar({
  nashvilleMode,
  onToggleMode,
  twoColumnLayout,
  onToggleTwoColumn,
  fitToPage,
  onToggleFitToPage,
  song,
  onNewSong,
  onLoadFile,
  fontSize,
  onFontSizeChange
}: ToolbarProps) {
  const handleLoadFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          onLoadFile(text);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSaveTxt = () => {
    let chartText = '';

    // Add metadata
    if (song.metadata.title) {
      chartText += `Title: ${song.metadata.title}\n`;
    }
    if (song.metadata.key) {
      chartText += `Key: ${song.metadata.key}\n`;
    }
    if (song.metadata.tempo) {
      chartText += `Tempo: ${song.metadata.tempo}\n`;
    }
    if (song.metadata.timeSignature) {
      chartText += `Meter: ${song.metadata.timeSignature}\n`;
    }
    if (song.metadata.style) {
      chartText += `Style: ${song.metadata.style}\n`;
    }
    if (song.metadata.feel) {
      chartText += `Feel: ${song.metadata.feel}\n`;
    }
    if (song.metadata.customProperties) {
      Object.entries(song.metadata.customProperties).forEach(([key, value]) => {
        chartText += `$${key}: ${value}\n`;
      });
    }

    if (chartText) {
      chartText += '\n';
    }

    // Add sections
    chartText += sectionsToChordText(song.sections);

    const blob = new Blob([chartText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.metadata.title || 'chart'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const pdfTitle = `${song.metadata.title || 'Untitled'} - ${song.metadata.key}`;

    // Detect if user is on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // Generate PDF on client side for mobile devices
      try {
        // Find the preview element (the one that's visible when printing)
        const previewElement = document.querySelector('.bg-white.rounded-lg.shadow-md.p-6:not(.no-print)') as HTMLElement;
        const headerElement = document.querySelector('.print\\:block') as HTMLElement;

        if (!previewElement) {
          console.error('Preview element not found');
          return;
        }

        // Temporarily enable fit-to-page for mobile to ensure single page
        const wasAlreadyFitToPage = fitToPage;
        if (!wasAlreadyFitToPage) {
          onToggleFitToPage();
          // Wait for re-render
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Create a container with both header and content
        const container = document.createElement('div');
        container.style.padding = '1.5cm';
        container.style.width = '21cm'; // A4 width
        container.style.backgroundColor = 'white';
        container.style.position = 'absolute';
        container.style.left = '-9999px';

        // Clone header and preview
        if (headerElement) {
          const headerClone = headerElement.cloneNode(true) as HTMLElement;
          headerClone.style.display = 'block';
          container.appendChild(headerClone);
        }

        const previewClone = previewElement.cloneNode(true) as HTMLElement;
        previewClone.classList.remove('shadow-md', 'rounded-lg');
        previewClone.style.padding = '0';
        previewClone.style.marginTop = '1cm';
        container.appendChild(previewClone);

        document.body.appendChild(container);

        // Capture as canvas with proper scaling
        const canvas = await html2canvas(container, {
          scale: 2, // Higher quality
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        // Remove temporary container
        document.body.removeChild(container);

        // Restore fit-to-page setting if it was changed
        if (!wasAlreadyFitToPage) {
          onToggleFitToPage();
        }

        // Create PDF (A4 size: 210mm x 297mm)
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const pdf = new jsPDF({
          orientation: imgHeight > 297 ? 'portrait' : 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 297));

        // Download PDF
        pdf.save(`${pdfTitle}.pdf`);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
      }
    } else {
      // Use native print dialog for desktop
      const originalTitle = document.title;
      document.title = pdfTitle;

      window.print();

      // Restore original title after print dialog
      setTimeout(() => {
        document.title = originalTitle;
      }, 100);
    }
  };

  return (
    <div className="bg-gray-800 text-white shadow-lg no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold">🎵 MusicChart</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onNewSong}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
            >
              New
            </button>
            <button
              onClick={handleLoadFile}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
            >
              Load
            </button>
            <button
              onClick={handleSaveTxt}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
            >
              Txt
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
            >
              PDF
            </button>

            <button
              onClick={onToggleTwoColumn}
              className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                twoColumnLayout
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title="Two column layout"
            >
              {twoColumnLayout ? '2 Col' : '1 Col'}
            </button>

            <label className="flex items-center space-x-1 px-3 py-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
              <input
                type="checkbox"
                checked={fitToPage}
                onChange={onToggleFitToPage}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-xs">Fit</span>
            </label>

            <select
              value={fontSize}
              onChange={(e) => onFontSizeChange(e.target.value)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm cursor-pointer"
            >
              <option value="small">Small</option>
              <option value="normal">Normal</option>
              <option value="medium">Medium</option>
              <option value="big">Big</option>
            </select>

            <div className="flex items-center bg-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={onToggleMode}
                className={`px-3 py-2 transition-colors text-sm ${
                  nashvilleMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                123
              </button>
              <button
                onClick={onToggleMode}
                className={`px-3 py-2 transition-colors text-sm ${
                  !nashvilleMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                ABC
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
