import { useState, useEffect } from 'react';
import { Song } from '../types/song';
import { Setlist } from '../db/database';
import { getChartsInSetlist, saveChart } from '../db/operations';
import ChordTextEditor from './ChordTextEditor';
import ChordTextOutput from './ChordTextOutput';
import PrintHeader from './PrintHeader';
import SetlistManager from './SetlistManager';

interface SetlistViewProps {
  isOpen: boolean;
  setlist: Setlist | null;
  onClose: () => void;
  onOpenSetlist: (setlist: Setlist) => void;
  nashvilleMode: boolean;
  twoColumnLayout: boolean;
  fitToPage: boolean;
  fontSize: string;
}

export default function SetlistView({
  isOpen,
  setlist,
  onClose,
  onOpenSetlist,
  nashvilleMode,
  twoColumnLayout,
  fitToPage,
  fontSize
}: SetlistViewProps) {
  const [charts, setCharts] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(true); // Default to Live Mode
  const [showSetlistManager, setShowSetlistManager] = useState(false);

  useEffect(() => {
    if (isOpen && setlist) {
      loadCharts();
    }
  }, [isOpen, setlist]);

  useEffect(() => {
    if (charts.length > 0) {
      setCurrentSong(charts[currentIndex]);
    }
  }, [currentIndex, charts]);

  const loadCharts = async () => {
    if (!setlist) return;
    const loadedCharts = await getChartsInSetlist(setlist.id);
    setCharts(loadedCharts);
    setCurrentIndex(0);
  };

  const handleSetlistManagerClose = () => {
    setShowSetlistManager(false);
    // Reload charts in case order changed
    loadCharts();
  };

  const handleNext = () => {
    if (currentIndex < charts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleUpdateSong = async (updatedSong: Song) => {
    // Auto-save changes
    await saveChart(updatedSong);

    // Update local state
    setCurrentSong(updatedSong);
    const newCharts = [...charts];
    newCharts[currentIndex] = updatedSong;
    setCharts(newCharts);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      handlePrevious();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentIndex, charts.length]);

  if (!isOpen || !setlist || !currentSong) return null;

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Header/Navigation Bar */}
      <div className="bg-gray-800 text-white shadow-lg no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left side - Back and Reorder buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
            >
              ← Back
            </button>
            <button
              onClick={() => setShowSetlistManager(true)}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
              title="Reorder songs in setlist"
            >
              ⇅ Reorder
            </button>
          </div>

          {/* Setlist info and navigation */}
          <div className="flex-1 flex items-center justify-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>

            <div className="text-center">
              <div className="text-lg font-semibold">
                {setlist.name}
              </div>
              <div className="text-sm text-gray-400">
                {currentIndex + 1} / {charts.length} - {currentSong.metadata.title}
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === charts.length - 1}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>

          {/* Mode Toggle & Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setIsLiveMode(true)}
                className={`px-3 py-2 transition-colors text-sm ${
                  isLiveMode
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                🎸 Live
              </button>
              <button
                onClick={() => setIsLiveMode(false)}
                className={`px-3 py-2 transition-colors text-sm ${
                  !isLiveMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                ✏️ Edit
              </button>
            </div>
            {!isLiveMode && (
              <div className="text-sm text-green-400">
                ✓ Auto-save
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Song List (thumbnails) - scrollable - Only in Edit Mode */}
      {!isLiveMode && (
        <div className="bg-gray-700 px-4 py-2 overflow-x-auto no-print">
          <div className="flex gap-2 max-w-7xl mx-auto">
            {charts.map((chart, index) => (
              <button
                key={chart.id}
                onClick={() => setCurrentIndex(index)}
                className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  index === currentIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                }`}
              >
                {index + 1}. {chart.metadata.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {isLiveMode ? (
          /* Live Mode - Chart Only */
          <div className="max-w-7xl mx-auto p-6 print:p-0 print:max-w-none">
            <PrintHeader metadata={currentSong.metadata} />

            <div className={`mt-8 print:mt-4 ${fitToPage ? 'print-fit-to-page' : ''}`}>
              <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none print:p-0">
                <ChordTextOutput
                  song={currentSong}
                  nashvilleMode={nashvilleMode}
                  twoColumnLayout={twoColumnLayout}
                  fitToPage={fitToPage}
                  fontSize={fontSize}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode - Editor + Preview */
          <div className="max-w-7xl mx-auto p-6 print:p-0 print:max-w-none">
            <PrintHeader metadata={currentSong.metadata} />

            <div className={`mt-8 print:mt-4 ${fitToPage ? 'print-fit-to-page' : ''}`}>
              <ChordTextEditor
                song={currentSong}
                nashvilleMode={nashvilleMode}
                twoColumnLayout={twoColumnLayout}
                fitToPage={fitToPage}
                fontSize={fontSize}
                onUpdate={handleUpdateSong}
              />
            </div>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="bg-gray-800 text-gray-400 text-xs py-2 px-4 text-center no-print">
        <span className={isLiveMode ? 'text-green-400 font-semibold' : ''}>
          {isLiveMode ? '🎸 LIVE MODE' : '✏️ EDIT MODE'}
        </span>
        {' | '}
        Keyboard: ← → or ↑ ↓ to navigate | ESC to close
      </div>

      {/* SetlistManager Modal */}
      <SetlistManager
        isOpen={showSetlistManager}
        onClose={handleSetlistManagerClose}
        onOpenSetlist={onOpenSetlist}
      />
    </div>
  );
}
