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

function App() {
  const [nashvilleMode, setNashvilleMode] = useState(true);
  const [twoColumnLayout, setTwoColumnLayout] = useState(false);
  const [fitToPage, setFitToPage] = useState(true); // Default to true
  const [fontSize, setFontSize] = useState('normal');
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

  // Auto-save when song changes (debounced)
  useEffect(() => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Only auto-save if it's a saved chart (not a new chart)
    const isSavedChart = song.id && !song.id.startsWith('new-') && !song.id.startsWith('loaded-');

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
      if (updatedSong.id && !updatedSong.id.startsWith('new-') && !updatedSong.id.startsWith('loaded-')) {
        try {
          await saveChart(updatedSong);
          console.log('Auto-saved chart:', updatedSong.metadata.title);
        } catch (error) {
          console.error('Auto-save error:', error);
        }
      }
    }, 1000);
  };

  const handleLoadFile = (text: string) => {
    const result = parseChordTextWithMetadata(text, nashvilleMode);
    setSong({
      id: `loaded-${Date.now()}`,
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

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <NewToolbar
          nashvilleMode={nashvilleMode}
          onToggleMode={() => setNashvilleMode(!nashvilleMode)}
          twoColumnLayout={twoColumnLayout}
          onToggleTwoColumn={() => setTwoColumnLayout(!twoColumnLayout)}
          fitToPage={fitToPage}
          onToggleFitToPage={() => setFitToPage(!fitToPage)}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
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

        <div className="max-w-7xl mx-auto p-6 print:p-0 print:max-w-none">
          <PrintHeader metadata={song.metadata} />

          {/* Save button with status indicator */}
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

          <div className={`mt-8 print:mt-4 ${fitToPage ? 'print-fit-to-page' : ''}`}>
            <ChordTextEditor
              song={song}
              nashvilleMode={nashvilleMode}
              twoColumnLayout={twoColumnLayout}
              fitToPage={fitToPage}
              fontSize={fontSize}
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
    </>
  );
}

export default App;
