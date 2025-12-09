import { useState, useEffect, useRef } from 'react';
import { Song } from '../types/song';
import { Setlist } from '../db/database';
import { getChartsInSetlist, saveChart, updateSetlistItemOrder } from '../db/operations';
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
  const [showControls, setShowControls] = useState(true); // Show/hide controls in Live Mode
  const [showSongMenu, setShowSongMenu] = useState(false); // Show/hide song menu in Edit Mode
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showSongListOverlay, setShowSongListOverlay] = useState(false);
  const [liveFontSize, setLiveFontSize] = useState<string>(fontSize);
  const [liveTwoColumn, setLiveTwoColumn] = useState<boolean>(twoColumnLayout);
  const wakeLockRef = useRef<any>(null);

  // Update live settings when props change
  useEffect(() => {
    setLiveFontSize(fontSize);
    setLiveTwoColumn(twoColumnLayout);
  }, [fontSize, twoColumnLayout]);

  // Screen Wake Lock - prevent screen from sleeping in Live Mode
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isLiveMode) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock activated');
        }
      } catch (err) {
        console.error('Wake Lock error:', err);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
          console.log('Wake Lock released');
        } catch (err) {
          console.error('Wake Lock release error:', err);
        }
      }
    };

    if (isLiveMode) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Handle visibility change (when user switches tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLiveMode) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLiveMode]);

  useEffect(() => {
    if (isOpen && setlist) {
      loadCharts();
    }
  }, [isOpen, setlist]);

  useEffect(() => {
    if (charts.length > 0) {
      // Ensure currentIndex is within bounds
      const validIndex = Math.max(0, Math.min(currentIndex, charts.length - 1));
      if (validIndex !== currentIndex) {
        setCurrentIndex(validIndex);
      }
      setCurrentSong(charts[validIndex]);
    }
  }, [currentIndex, charts]);

  // Close song menu when switching to Live mode
  useEffect(() => {
    if (isLiveMode) {
      setShowSongMenu(false);
    }
  }, [isLiveMode]);

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

  const handleUpdateSong = (updatedSong: Song) => {
    // Update local state immediately
    setCurrentSong(updatedSong);
    const newCharts = [...charts];
    newCharts[currentIndex] = updatedSong;
    setCharts(newCharts);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');

    // Debounced auto-save (1 second)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveChart(updatedSong);
        setSaveStatus('saved');
        console.log('✓ Auto-saved:', updatedSong.metadata.title);

        // Clear "saved" status after 2 seconds
        if (saveStatusTimeoutRef.current) {
          clearTimeout(saveStatusTimeoutRef.current);
        }
        saveStatusTimeoutRef.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveStatus('idle');
      }
    }, 1000);
  };

  const handleReorderCharts = async (newCharts: Song[]) => {
    if (!setlist) return;

    try {
      // Update database first
      const chartIds = newCharts.map(chart => chart.id);
      await updateSetlistItemOrder(setlist.id, chartIds);

      // Then update local state
      setCharts(newCharts);
    } catch (error) {
      console.error('Error reordering charts:', error);
      // Reload charts from database on error
      await loadCharts();
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newCharts = [...charts];
    [newCharts[index - 1], newCharts[index]] = [newCharts[index], newCharts[index - 1]];

    // Adjust current index if needed
    if (currentIndex === index) {
      setCurrentIndex(index - 1);
    } else if (currentIndex === index - 1) {
      setCurrentIndex(index);
    }

    await handleReorderCharts(newCharts);
  };

  const handleMoveDown = async (index: number) => {
    if (index === charts.length - 1) return;
    const newCharts = [...charts];
    [newCharts[index], newCharts[index + 1]] = [newCharts[index + 1], newCharts[index]];

    // Adjust current index if needed
    if (currentIndex === index) {
      setCurrentIndex(index + 1);
    } else if (currentIndex === index + 1) {
      setCurrentIndex(index);
    }

    await handleReorderCharts(newCharts);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newCharts = [...charts];
    const [removed] = newCharts.splice(draggedIndex, 1);
    newCharts.splice(dropIndex, 0, removed);

    // Adjust current index
    if (currentIndex === draggedIndex) {
      setCurrentIndex(dropIndex);
    } else if (draggedIndex < currentIndex && dropIndex >= currentIndex) {
      setCurrentIndex(currentIndex - 1);
    } else if (draggedIndex > currentIndex && dropIndex <= currentIndex) {
      setCurrentIndex(currentIndex + 1);
    }

    await handleReorderCharts(newCharts);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const increaseFontSize = () => {
    const sizes = ['xs', 'tiny', 'small', 'normal', 'medium', 'big'];
    const currentIndex = sizes.indexOf(liveFontSize);
    if (currentIndex < sizes.length - 1) {
      setLiveFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes = ['xs', 'tiny', 'small', 'normal', 'medium', 'big'];
    const currentIndex = sizes.indexOf(liveFontSize);
    if (currentIndex > 0) {
      setLiveFontSize(sizes[currentIndex - 1]);
    }
  };

  const toggleTwoColumn = () => {
    setLiveTwoColumn(!liveTwoColumn);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // In Edit Mode, allow normal arrow key usage in textarea
    if (!isLiveMode) {
      if (e.key === 'Escape') {
        onClose();
      }
      return;
    }

    // In Live Mode, use arrows for navigation
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
  }, [isOpen, currentIndex, charts.length, isLiveMode]);

  if (!isOpen || !setlist || !currentSong) return null;

  const toggleControls = () => {
    if (isLiveMode) {
      setShowControls(!showControls);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Header/Navigation Bar */}
      <div className={`bg-gray-800 text-white shadow-lg no-print transition-all duration-300 ${
        isLiveMode && !showControls ? 'h-0 overflow-hidden' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Top row on mobile, left on desktop */}
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={onClose}
              className="px-3 sm:px-3 py-2 sm:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm sm:text-sm"
            >
              ← Back
            </button>
            <button
              onClick={() => setShowSetlistManager(true)}
              className="px-3 sm:px-3 py-2 sm:py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm sm:text-sm"
              title="Reorder songs in setlist"
            >
              ⇅
            </button>

            {/* Song Menu Toggle - Only in Edit Mode */}
            {!isLiveMode && (
              <button
                onClick={() => setShowSongMenu(!showSongMenu)}
                className="px-3 sm:px-3 py-2 sm:py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm sm:text-sm"
                title="Show song list"
              >
                ≡
              </button>
            )}

            {/* Mode Toggle - visible on mobile in top row */}
            <div className="flex sm:hidden items-center bg-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setIsLiveMode(true)}
                className={`px-3 py-2 transition-colors text-sm ${
                  isLiveMode
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                🎸
              </button>
              <button
                onClick={() => setIsLiveMode(false)}
                className={`px-3 py-2 transition-colors text-sm ${
                  !isLiveMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                ✏️
              </button>
            </div>
          </div>

          {/* Setlist info and navigation */}
          <div className="flex-1 flex items-center justify-center gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-3 sm:px-3 py-2 sm:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ←
            </button>

            <div className="text-center min-w-0 flex-1">
              <div className="text-sm sm:text-lg font-semibold truncate">
                {setlist.name}
              </div>
              <div className="text-xs sm:text-sm text-gray-400 truncate">
                {currentIndex + 1}/{charts.length} - {currentSong.metadata.title}
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === charts.length - 1}
              className="px-3 sm:px-3 py-2 sm:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>

          {/* Mode Toggle & Status - hidden on mobile, visible on desktop */}
          <div className="hidden sm:flex items-center gap-3">
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
              <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                saveStatus === 'saving'
                  ? 'bg-yellow-600 text-white'
                  : saveStatus === 'saved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}>
                {saveStatus === 'saving' ? '💾 Sparar...' : saveStatus === 'saved' ? '✓ Sparad' : '💾 Autosave'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Song Menu Sidebar - Only in Edit Mode */}
      {!isLiveMode && showSongMenu && (
        <div className="fixed left-0 top-0 bottom-0 w-64 bg-gray-800 text-white shadow-2xl z-40 overflow-y-auto no-print">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Songs</h3>
              <button
                onClick={() => setShowSongMenu(false)}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1">
              {charts.map((chart, index) => (
                <div
                  key={chart.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 rounded-lg transition-all ${
                    draggedIndex === index
                      ? 'opacity-50 border-2 border-blue-400'
                      : dragOverIndex === index
                      ? 'border-2 border-blue-500 bg-blue-900'
                      : 'border-2 border-transparent'
                  }`}
                >
                  {/* Arrow buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(index);
                      }}
                      disabled={index === 0}
                      className="px-1 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(index);
                      }}
                      disabled={index === charts.length - 1}
                      className="px-1 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>

                  {/* Song button */}
                  <button
                    onClick={() => {
                      setCurrentIndex(index);
                      setShowSongMenu(false);
                    }}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      index === currentIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{index + 1}. {chart.metadata.title}</div>
                    <div className="text-xs text-gray-400">Key: {chart.metadata.key}</div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for Song Menu */}
      {!isLiveMode && showSongMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 no-print"
          onClick={() => setShowSongMenu(false)}
        />
      )}

      {/* Main Content */}
      <div
        className="flex-1 overflow-auto relative"
        onClick={toggleControls}
      >
        {isLiveMode ? (
          <>
            {/* Live Mode - Chart Only */}
            {/* Large transparent navigation buttons - only visible when controls are shown */}
            {showControls && (
              <>
                {/* Previous button - left side */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  disabled={currentIndex === 0}
                  className="fixed left-4 top-1/2 -translate-y-1/2 z-40 w-16 h-32 bg-black bg-opacity-30 hover:bg-opacity-50 rounded-lg transition-all disabled:opacity-10 disabled:cursor-not-allowed text-white text-4xl flex items-center justify-center"
                >
                  ‹
                </button>

                {/* Next button - right side */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  disabled={currentIndex === charts.length - 1}
                  className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-16 h-32 bg-black bg-opacity-30 hover:bg-opacity-50 rounded-lg transition-all disabled:opacity-10 disabled:cursor-not-allowed text-white text-4xl flex items-center justify-center"
                >
                  ›
                </button>

                {/* Song list button - center top */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSongListOverlay(true);
                  }}
                  className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-6 py-3 bg-black bg-opacity-30 hover:bg-opacity-50 rounded-lg transition-all text-white text-sm flex items-center gap-2"
                >
                  <span className="text-xl">≡</span>
                  <span>Songs</span>
                </button>

                {/* Font size and layout controls - bottom right */}
                <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      increaseFontSize();
                    }}
                    disabled={liveFontSize === 'big'}
                    className="w-12 h-12 bg-black bg-opacity-30 hover:bg-opacity-50 rounded-lg transition-all disabled:opacity-10 disabled:cursor-not-allowed text-white text-2xl font-bold flex items-center justify-center"
                  >
                    A+
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      decreaseFontSize();
                    }}
                    disabled={liveFontSize === 'xs'}
                    className="w-12 h-12 bg-black bg-opacity-30 hover:bg-opacity-50 rounded-lg transition-all disabled:opacity-10 disabled:cursor-not-allowed text-white text-xl font-bold flex items-center justify-center"
                  >
                    A-
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTwoColumn();
                    }}
                    className={`w-12 h-12 ${liveTwoColumn ? 'bg-blue-600 bg-opacity-70' : 'bg-black bg-opacity-30'} hover:bg-opacity-50 rounded-lg transition-all text-white text-sm font-bold flex items-center justify-center`}
                  >
                    2C
                  </button>
                </div>
              </>
            )}

            <div className={`max-w-7xl mx-auto print:max-w-none ${showControls ? 'p-2 sm:p-3' : 'p-0'} print:p-0`}>
            <PrintHeader metadata={currentSong.metadata} />

            <div className={`${showControls ? 'mt-2 sm:mt-3' : 'mt-0'} print:mt-4 ${fitToPage ? 'print-fit-to-page' : ''}`}>
              <div className={`bg-white ${showControls ? 'rounded-lg shadow-md p-2 sm:p-3' : 'p-4'} print:shadow-none print:p-0`}>
                <ChordTextOutput
                  song={currentSong}
                  nashvilleMode={nashvilleMode}
                  twoColumnLayout={isLiveMode ? liveTwoColumn : twoColumnLayout}
                  fitToPage={fitToPage}
                  fontSize={isLiveMode ? liveFontSize : fontSize}
                />
              </div>
            </div>
          </div>
          </>
        ) : (
          <div className="max-w-7xl mx-auto p-6 print:p-0 print:max-w-none">
            {/* Edit Mode - Editor + Preview */}
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
      <div className={`bg-gray-800 text-gray-400 text-xs py-2 px-4 text-center no-print transition-all duration-300 ${
        isLiveMode && !showControls ? 'h-0 overflow-hidden py-0' : ''
      }`}>
        <span className={isLiveMode ? 'text-green-400 font-semibold' : ''}>
          {isLiveMode ? '🎸 LIVE MODE' : '✏️ EDIT MODE'}
        </span>
        {' | '}
        {isLiveMode ? (
          <>
            Keyboard: ← → or ↑ ↓ to navigate | ESC to close | Tap screen to show/hide controls
          </>
        ) : (
          <>
            Keyboard: ESC to close
          </>
        )}
      </div>

      {/* SetlistManager Modal */}
      <SetlistManager
        isOpen={showSetlistManager}
        onClose={handleSetlistManagerClose}
        onOpenSetlist={onOpenSetlist}
      />

      {/* Song List Overlay - for quick navigation in Live Mode */}
      {showSongListOverlay && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-70 z-50"
            onClick={() => setShowSongListOverlay(false)}
          />
          <div className="fixed inset-4 md:inset-x-1/4 md:inset-y-12 bg-gray-800 rounded-lg z-50 overflow-hidden flex flex-col">
            <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
              <h3 className="text-white text-lg font-bold">{setlist.name}</h3>
              <button
                onClick={() => setShowSongListOverlay(false)}
                className="text-white hover:text-gray-300 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {charts.map((chart, index) => (
                  <button
                    key={chart.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      setShowSongListOverlay(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      index === currentIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-base">
                          {index + 1}. {chart.metadata.title}
                        </div>
                        <div className="text-sm text-gray-400">
                          Key: {chart.metadata.key}
                          {chart.metadata.tempo && ` | ${chart.metadata.tempo} BPM`}
                        </div>
                      </div>
                      {index === currentIndex && (
                        <span className="text-2xl">▶</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
