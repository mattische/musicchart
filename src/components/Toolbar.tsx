import { Song } from '../types/song';

interface ToolbarProps {
  nashvilleMode: boolean;
  onToggleMode: () => void;
  twoColumnLayout: boolean;
  onToggleTwoColumn: () => void;
  fitToPage: boolean;
  onToggleFitToPage: () => void;
  song: Song;
  onNewSong: () => void;
}

export default function Toolbar({
  nashvilleMode,
  onToggleMode,
  twoColumnLayout,
  onToggleTwoColumn,
  fitToPage,
  onToggleFitToPage,
  song,
  onNewSong
}: ToolbarProps) {
  const handleSave = () => {
    // TODO: Implement save to IndexedDB
    alert('Save functionality coming soon!');
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
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">🎵 MusicChart</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onNewSong}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              New
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              PDF
            </button>

            <button
              onClick={onToggleTwoColumn}
              className={`px-4 py-2 rounded-lg transition-colors ${
                twoColumnLayout
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title="Two column layout"
            >
              {twoColumnLayout ? '2 Columns' : '1 Column'}
            </button>

            <label className="flex items-center space-x-2 px-4 py-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
              <input
                type="checkbox"
                checked={fitToPage}
                onChange={onToggleFitToPage}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm">Fit to page</span>
            </label>

            <div className="flex items-center bg-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={onToggleMode}
                className={`px-4 py-2 transition-colors ${
                  nashvilleMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Nashville (123)
              </button>
              <button
                onClick={onToggleMode}
                className={`px-4 py-2 transition-colors ${
                  !nashvilleMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Chords (ABC)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
