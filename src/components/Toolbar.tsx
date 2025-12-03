import { Song } from '../types/song';
import { sectionsToChordText } from '../utils/jotChordParser';

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

  const handleExportPDF = () => {
    // Set document title to "Song Title - Key" for PDF filename
    const originalTitle = document.title;
    const pdfTitle = `${song.metadata.title || 'Untitled'} - ${song.metadata.key}`;
    document.title = pdfTitle;

    window.print();

    // Restore original title after print dialog
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
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
