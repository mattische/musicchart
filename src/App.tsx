import { useState, useEffect, useRef } from 'react';
import { Song } from './types/song';
import { parseChordTextWithMetadata } from './utils/jotChordParser';
import { Setlist } from './db/database';
import { saveChart } from './db/operations';
import NewToolbar from './components/NewToolbar';
import ChordTextEditor from './components/ChordTextEditor';
import PrintHeader from './components/PrintHeader';
import SetlistView from './components/SetlistView';
import SaveChartDialog from './components/SaveChartDialog';
import LayoutGuide from './components/LayoutGuide';

function App() {
  const [nashvilleMode, setNashvilleMode] = useState(true);
  const [twoColumnLayout, setTwoColumnLayout] = useState(false);
  const [fitToPage, setFitToPage] = useState(true); // Default to true
  const [fontSize, setFontSize] = useState('normal');
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('fontFamily') || 'inter');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [alignment, setAlignment] = useState(() => localStorage.getItem('alignment') || 'left');
  const [showLayoutGuide, setShowLayoutGuide] = useState(false);
  const [optimizeForScreen, setOptimizeForScreen] = useState(() => localStorage.getItem('optimizeForScreen') === 'true');
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [openSetlist, setOpenSetlist] = useState<Setlist | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [song, setSong] = useState<Song>({
    id: 'new-song',
    metadata: {
      title: 'Untitled Song',
      key: 'C',
      tempo: 120,
      timeSignature: '4/4',
    },
    sections: [
      {
        id: 'section-1',
        name: 'Verse 1',
        measures: [
          {
            id: 'measure-1',
            chords: [],
            rawText: '',
          },
        ],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Persist font family to localStorage
  useEffect(() => {
    localStorage.setItem('fontFamily', fontFamily);
  }, [fontFamily]);

  // Persist dark mode to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Persist alignment to localStorage
  useEffect(() => {
    localStorage.setItem('alignment', alignment);
  }, [alignment]);

  // Persist optimize for screen to localStorage
  useEffect(() => {
    localStorage.setItem('optimizeForScreen', optimizeForScreen.toString());
  }, [optimizeForScreen]);

  // Track screen width for optimization
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent horizontal scroll when optimizeForScreen is enabled
  useEffect(() => {
    if (optimizeForScreen) {
      document.body.style.overflowX = 'hidden';
      document.documentElement.style.overflowX = 'hidden';
    } else {
      document.body.style.overflowX = '';
      document.documentElement.style.overflowX = '';
    }

    return () => {
      document.body.style.overflowX = '';
      document.documentElement.style.overflowX = '';
    };
  }, [optimizeForScreen]);

  // Auto-save when song changes (debounced)
  useEffect(() => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Only auto-save if it's a saved chart (not a new chart, loaded chart, or help chart)
    const isSavedChart = song.id && !song.id.startsWith('new-') && !song.id.startsWith('loaded-') && !song.id.startsWith('help-');

    if (isSavedChart) {
      setAutoSaveStatus('saving');

      // Debounce auto-save by 1 second
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveChart(song);
          setAutoSaveStatus('saved');
          console.log('✓ Auto-saved:', song.metadata.title);

          // Clear "saved" status after 2 seconds
          if (autoSaveStatusTimeoutRef.current) {
            clearTimeout(autoSaveStatusTimeoutRef.current);
          }
          autoSaveStatusTimeoutRef.current = setTimeout(() => {
            setAutoSaveStatus('idle');
          }, 2000);
        } catch (error) {
          console.error('Auto-save failed:', error);
          setAutoSaveStatus('idle');
        }
      }, 1000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [song]);

  const updateSong = (updatedSong: Song) => {
    setSong(updatedSong);

    // Auto-save after 1 second of inactivity
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (updatedSong.id && !updatedSong.id.startsWith('new-') && !updatedSong.id.startsWith('loaded-') && !updatedSong.id.startsWith('help-')) {
        try {
          await saveChart(updatedSong);
          console.log('Auto-saved chart:', updatedSong.metadata.title);
        } catch (error) {
          console.error('Auto-save error:', error);
        }
      }
    }, 1000);
  };

  const handleLoadFile = (text: string, specialId?: string) => {
    const result = parseChordTextWithMetadata(text, nashvilleMode);
    setSong({
      id: specialId || `loaded-${Date.now()}`,
      metadata: {
        title: result.metadata?.title || 'Untitled',
        key: result.metadata?.key || 'C',
        tempo: result.metadata?.tempo,
        timeSignature: result.metadata?.timeSignature,
        style: result.metadata?.style,
        feel: result.metadata?.feel,
        customProperties: result.metadata?.customProperties,
      },
      sections: result.sections,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const handleLoadChart = (chart: Song) => {
    setSong(chart);
  };

  const handleChartSaved = (chartId: string) => {
    // Update song ID to reflect it's been saved
    setSong(prev => ({ ...prev, id: chartId }));
    setAutoSaveStatus('saved');
  };

  const handleManualSave = async () => {
    const isSavedChart = song.id && !song.id.startsWith('new-') && !song.id.startsWith('loaded-');

    if (isSavedChart) {
      // Chart is already saved, just save changes
      setAutoSaveStatus('saving');
      try {
        await saveChart(song);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Save failed:', error);
        setAutoSaveStatus('idle');
      }
    } else {
      // New chart, show save dialog
      setShowSaveDialog(true);
    }
  };

  // Get font family style
  const getFontFamilyStyle = () => {
    switch (fontFamily) {
      case 'inter': return { fontFamily: 'Inter, sans-serif' };
      case 'roboto': return { fontFamily: 'Roboto, sans-serif' };
      case 'opensans': return { fontFamily: '"Open Sans", sans-serif' };
      case 'lato': return { fontFamily: 'Lato, sans-serif' };
      case 'system': return { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' };
      default: return { fontFamily: 'Inter, sans-serif' };
    }
  };

  // Get optimal max width based on screen optimization
  const getOptimalMaxWidth = () => {
    if (!optimizeForScreen) return '1920px';

    // Use 100% to fit within screen, overflow is hidden on parent
    return '100%';
  };

  return (
    <>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} ${optimizeForScreen ? 'overflow-x-hidden' : ''}`} style={getFontFamilyStyle()}>
        <NewToolbar
          nashvilleMode={nashvilleMode}
          onToggleMode={() => setNashvilleMode(!nashvilleMode)}
          twoColumnLayout={twoColumnLayout}
          onToggleTwoColumn={() => setTwoColumnLayout(!twoColumnLayout)}
          fitToPage={fitToPage}
          onToggleFitToPage={() => setFitToPage(!fitToPage)}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          fontFamily={fontFamily}
          onFontFamilyChange={setFontFamily}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          alignment={alignment}
          onAlignmentChange={setAlignment}
          showLayoutGuide={showLayoutGuide}
          onToggleLayoutGuide={() => setShowLayoutGuide(!showLayoutGuide)}
          optimizeForScreen={optimizeForScreen}
          onToggleOptimizeForScreen={() => setOptimizeForScreen(!optimizeForScreen)}
          song={song}
          onNewSong={() => {
            setSong({
              id: `new-${Date.now()}`,
              metadata: {
                title: 'Untitled',
                key: 'C',
              },
              sections: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }}
          onLoadFile={handleLoadFile}
          onLoadChart={handleLoadChart}
          onChartSaved={handleChartSaved}
          onOpenSetlist={setOpenSetlist}
        />

        <div className={`mx-auto ${optimizeForScreen ? 'p-2 sm:p-4' : 'p-6'} print:p-0 print:max-w-none`} style={{ maxWidth: getOptimalMaxWidth() }}>
          <PrintHeader metadata={song.metadata} />

          {/* Save button with status indicator */}
          {!song.id.startsWith('help-') && (
            <div className="no-print flex justify-end mb-2">
              <button
                onClick={handleManualSave}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  autoSaveStatus === 'saving'
                    ? 'bg-yellow-500 text-white cursor-wait'
                    : autoSaveStatus === 'saved'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : song.id && !song.id.startsWith('new-') && !song.id.startsWith('loaded-')
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
                disabled={autoSaveStatus === 'saving'}
              >
                {autoSaveStatus === 'saving'
                  ? '💾 Sparar...'
                  : autoSaveStatus === 'saved'
                  ? '✓ Sparad'
                  : song.id && !song.id.startsWith('new-') && !song.id.startsWith('loaded-')
                  ? '💾 Spara'
                  : '💾 Spara som...'}
              </button>
            </div>
          )}

          <div className={`mt-8 print:mt-4 ${fitToPage ? 'print-fit-to-page' : ''}`}>
            <ChordTextEditor
              song={song}
              nashvilleMode={nashvilleMode}
              twoColumnLayout={twoColumnLayout}
              fitToPage={fitToPage}
              fontSize={fontSize}
              alignment={alignment}
              onUpdate={updateSong}
            />
          </div>
        </div>
      </div>

      {/* Setlist View - Full Screen Overlay */}
      <SetlistView
        isOpen={openSetlist !== null}
        setlist={openSetlist}
        onClose={() => setOpenSetlist(null)}
        onOpenSetlist={setOpenSetlist}
        nashvilleMode={nashvilleMode}
        twoColumnLayout={twoColumnLayout}
        fitToPage={fitToPage}
        fontSize={fontSize}
        alignment={alignment}
        fontFamily={fontFamily}
        darkMode={darkMode}
        optimizeForScreen={optimizeForScreen}
      />

      {/* Save Chart Dialog */}
      <SaveChartDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        song={song}
        onSaved={(chartId) => {
          handleChartSaved(chartId);
          setShowSaveDialog(false);
        }}
      />

      {/* Layout Guide Overlay */}
      <LayoutGuide isVisible={showLayoutGuide} />
    </>
  );
}

export default App;
