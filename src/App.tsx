import { useState } from 'react';
import { Song } from './types/song';
import { parseChordTextWithMetadata } from './utils/jotChordParser';
import { Setlist } from './db/database';
import NewToolbar from './components/NewToolbar';
import ChordTextEditor from './components/ChordTextEditor';
import PrintHeader from './components/PrintHeader';
import SetlistView from './components/SetlistView';

function App() {
  const [nashvilleMode, setNashvilleMode] = useState(true);
  const [twoColumnLayout, setTwoColumnLayout] = useState(false);
  const [fitToPage, setFitToPage] = useState(true); // Default to true
  const [fontSize, setFontSize] = useState('normal');
  const [openSetlist, setOpenSetlist] = useState<Setlist | null>(null);
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


  const updateSong = (updatedSong: Song) => {
    setSong(updatedSong);
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
        nashvilleMode={nashvilleMode}
        twoColumnLayout={twoColumnLayout}
        fitToPage={fitToPage}
        fontSize={fontSize}
      />
    </>
  );
}

export default App;
