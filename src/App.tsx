import { useState } from 'react';
import { Song } from './types/song';
import Toolbar from './components/Toolbar';
import ChordTextEditor from './components/ChordTextEditor';
import PrintHeader from './components/PrintHeader';

function App() {
  const [nashvilleMode, setNashvilleMode] = useState(true);
  const [twoColumnLayout, setTwoColumnLayout] = useState(false);
  const [fitToPage, setFitToPage] = useState(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar
        nashvilleMode={nashvilleMode}
        onToggleMode={() => setNashvilleMode(!nashvilleMode)}
        twoColumnLayout={twoColumnLayout}
        onToggleTwoColumn={() => setTwoColumnLayout(!twoColumnLayout)}
        fitToPage={fitToPage}
        onToggleFitToPage={() => setFitToPage(!fitToPage)}
        song={song}
        onNewSong={() => {
          setSong({
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
        }}
      />

      <div className="max-w-7xl mx-auto p-6 print:p-0 print:max-w-none">
        <PrintHeader metadata={song.metadata} />

        <div className={`mt-8 print:mt-4 ${fitToPage ? 'print-fit-to-page' : ''}`}>
          <ChordTextEditor
            song={song}
            nashvilleMode={nashvilleMode}
            twoColumnLayout={twoColumnLayout}
            fitToPage={fitToPage}
            onUpdate={updateSong}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
