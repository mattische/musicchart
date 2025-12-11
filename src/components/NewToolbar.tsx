import { useState } from 'react';
import { Song } from '../types/song';
import { Setlist } from '../db/database';
import { sectionsToChordText } from '../utils/jotChordParser';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ChartLibrary from './ChartLibrary';
import SetlistManager from './SetlistManager';
import SaveChartDialog from './SaveChartDialog';
import UserGuideModal from './UserGuideModal';
import { exportAllData, importData, createSetlist, exportSetlist, getAllSetlists, getChartsInSetlist } from '../db/operations';

interface ToolbarProps {
  nashvilleMode: boolean;
  onToggleMode: () => void;
  twoColumnLayout: boolean;
  onToggleTwoColumn: () => void;
  fitToPage: boolean;
  onToggleFitToPage: () => void;
  song: Song;
  onNewSong: () => void;
  onLoadFile: (text: string, specialId?: string) => void;
  onLoadChart: (chart: Song) => void;
  onChartSaved: (chartId: string) => void;
  onOpenSetlist: (setlist: Setlist) => void;
  fontSize: string;
  onFontSizeChange: (size: string) => void;
  fontFamily: string;
  onFontFamilyChange: (font: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  alignment: string;
  onAlignmentChange: (alignment: string) => void;
  showLayoutGuide: boolean;
  onToggleLayoutGuide: () => void;
  optimizeForScreen: boolean;
  onToggleOptimizeForScreen: () => void;
}

export default function NewToolbar({
  nashvilleMode,
  onToggleMode,
  twoColumnLayout,
  onToggleTwoColumn,
  fitToPage,
  onToggleFitToPage,
  song,
  onNewSong,
  onLoadFile,
  onLoadChart,
  onChartSaved,
  onOpenSetlist,
  fontSize,
  onFontSizeChange,
  fontFamily,
  onFontFamilyChange,
  darkMode,
  onToggleDarkMode,
  alignment,
  onAlignmentChange,
  showLayoutGuide,
  onToggleLayoutGuide,
  optimizeForScreen,
  onToggleOptimizeForScreen
}: ToolbarProps) {
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showChartLibrary, setShowChartLibrary] = useState(false);
  const [showSetlistManager, setShowSetlistManager] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showExportSetlistDialog, setShowExportSetlistDialog] = useState(false);
  const [availableSetlists, setAvailableSetlists] = useState<Setlist[]>([]);
  const [selectedSetlistIds, setSelectedSetlistIds] = useState<string[]>([]);
  const [setlistChartCounts, setSetlistChartCounts] = useState<Record<string, number>>({});

  const handleLoadFromFile = () => {
    setShowFileMenu(false);
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
    setShowFileMenu(false);
    let chartText = '';

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
    setShowFileMenu(false);
    const pdfTitle = `${song.metadata.title || 'Untitled'} - ${song.metadata.key}`;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      try {
        const previewElement = document.querySelector('.bg-white.rounded-lg.shadow-md.p-6:not(.no-print)') as HTMLElement;
        const headerElement = document.querySelector('.print\\:block') as HTMLElement;

        if (!previewElement) {
          console.error('Preview element not found');
          return;
        }

        const wasAlreadyFitToPage = fitToPage;
        if (!wasAlreadyFitToPage) {
          onToggleFitToPage();
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const container = document.createElement('div');
        container.style.padding = '1.5cm';
        container.style.width = '21cm';
        container.style.backgroundColor = 'white';
        container.style.position = 'absolute';
        container.style.left = '-9999px';

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

        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        document.body.removeChild(container);

        if (!wasAlreadyFitToPage) {
          onToggleFitToPage();
        }

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 297));

        pdf.save(`${pdfTitle}.pdf`);
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
      }
    } else {
      const originalTitle = document.title;
      document.title = pdfTitle;

      window.print();

      setTimeout(() => {
        document.title = originalTitle;
      }, 100);
    }
  };

  const handleCreateSetlist = async () => {
    setShowFileMenu(false);
    const name = prompt('Enter setlist name:');
    if (!name || !name.trim()) return;

    try {
      await createSetlist(name.trim());
      alert(`Setlist "${name.trim()}" created successfully!`);
    } catch (error) {
      console.error('Create setlist error:', error);
      alert('Failed to create setlist.');
    }
  };

  const handleExportSetlist = async () => {
    setShowFileMenu(false);

    try {
      const setlists = await getAllSetlists();

      if (setlists.length === 0) {
        alert('No setlists found to export.');
        return;
      }

      // Load chart counts for each setlist
      const counts: Record<string, number> = {};
      for (const setlist of setlists) {
        const charts = await getChartsInSetlist(setlist.id);
        counts[setlist.id] = charts.length;
      }

      setAvailableSetlists(setlists);
      setSetlistChartCounts(counts);
      setSelectedSetlistIds([]);
      setShowExportSetlistDialog(true);
    } catch (error) {
      console.error('Error loading setlists:', error);
      alert('Failed to load setlists.');
    }
  };

  const handleConfirmExportSetlist = async () => {
    if (selectedSetlistIds.length === 0) {
      alert('Please select at least one setlist to export.');
      return;
    }

    try {
      const date = new Date().toISOString().split('T')[0];

      if (selectedSetlistIds.length === 1) {
        // Single setlist export
        const selectedSetlist = availableSetlists.find(s => s.id === selectedSetlistIds[0]);
        if (!selectedSetlist) return;

        const data = await exportSetlist(selectedSetlist.id);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const sanitizedName = selectedSetlist.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        a.download = `setlist-${sanitizedName}-${date}.json`;

        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Multiple setlists export - combine into one file
        let combinedData = {
          version: 1,
          exportedAt: Date.now(),
          charts: [] as any[],
          setlists: [] as any[],
          setlistItems: [] as any[]
        };

        for (const setlistId of selectedSetlistIds) {
          const data = await exportSetlist(setlistId);

          // Merge charts (avoid duplicates)
          data.charts.forEach(chart => {
            if (!combinedData.charts.find(c => c.id === chart.id)) {
              combinedData.charts.push(chart);
            }
          });

          // Add setlist
          combinedData.setlists.push(...data.setlists);

          // Add setlist items
          combinedData.setlistItems.push(...data.setlistItems);
        }

        const blob = new Blob([JSON.stringify(combinedData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `setlists-${date}.json`;

        a.click();
        URL.revokeObjectURL(url);
      }

      setShowExportSetlistDialog(false);
      setSelectedSetlistIds([]);
    } catch (error) {
      console.error('Export setlist error:', error);
      alert('Failed to export setlist.');
    }
  };

  const toggleSetlistSelection = (setlistId: string) => {
    setSelectedSetlistIds(prev => {
      if (prev.includes(setlistId)) {
        return prev.filter(id => id !== setlistId);
      } else {
        return [...prev, setlistId];
      }
    });
  };

  const handleExportAllData = async () => {
    setShowFileMenu(false);
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    a.download = `musicchart-all-${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    setShowFileMenu(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            await importData(data);
            alert(`Import successful!\nImported:\n- ${data.charts?.length || 0} charts\n- ${data.setlists?.length || 0} setlists\n- ${data.setlistItems?.length || 0} setlist items`);
          } catch (error) {
            console.error('Import error:', error);
            alert('Failed to import data. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleShowSyntax = () => {
    setShowHelpMenu(false);
    const syntaxChart = `Title: Syntax Reference
Key: C
Tempo: 120
Meter: 4/4

// Basic Chords
1 2 3 4
5 6 7 1

// Chord Qualities
1M 1m 1+ 1°
17 1M7 1m7 1sus4

// Accidentals (write before the chord)
1 #2 b3 ##4
bb5 #6 b7 1

// Repeats
||: 1 2 3 4 :||
|: 5 6 7 1 :|

// Repeat Symbols
1 2 % %
5 6 % %

// Split Bars
[(1 2)] [(3 4)]
[(5 6)] [(7 1)]

// Endings - simple
1[(1. 4 )] 2[(2. 5 )]
||: 1 2 3[(1. 4 )] 5[(2. 1 )] :||

// Endings - with different content
1[ 1 2 3 4 ] 2[ 4 3 2 1 ]
||: 1M7 2m7 3[(1. 4M7 5 )] 6[(2. 1M7 )] :||

// Rests
1 x x 4
5 X 7 1

// Rest with Dots
1 x. x.. 4
5 X. 7. 1

// Note Values (q=quarter, h=half, w=whole, e=eighth, s=sixteenth)
1q 2h 3w 4e
1s 2q 3h 4w

// Push/Anticipation (< or >)
1 <2 3 >4
<5 6 >7 1

// Walkup and Walkdown
1 2@wu 3 4
5 6@wd 7 1

// Diamond Chords
1 <2> 3 <4>
<5> 6 <7> 1

// Fermata (hold)
1 2~ 3 4
5 6 7~ 1

// Modulation
||: 1 2 3 4 :||
<D>mod+2
||: 1 2 3 4 :||

// Navigation Markers - Symbols (rendered as large symbols)
§
⊕

// Navigation Markers - Text (rendered in yellow boxes)
D.S.
D.S. al Fine
D.S. al Coda
D.C.
D.C. al Fine
D.C. al Coda
Fine
To Coda

// How Navigation Markers Work:
// § (Segno) - Marks the place to return to when "D.S." is encountered
// ⊕ (Coda) - Marks the coda section (ending)
// D.S. (Dal Segno) - Jump back to the § symbol
// D.S. al Fine - Jump to § and play until "Fine"
// D.S. al Coda - Jump to §, play until "To Coda", then jump to ⊕
// D.C. (Da Capo) - Jump back to the beginning
// D.C. al Fine - Jump to beginning and play until "Fine"
// D.C. al Coda - Jump to beginning, play until "To Coda", then jump to ⊕
// Fine - Marks the end point
// To Coda - Marks where to jump to the coda (⊕)

// Separators
1 2 3 4
* 5 6 7 1

// Complex Example
||: 1M7 2m7 3m7 4M7 :||
5[(1. 67 )] <1>[(2. 1M7 )]
* 1@ 2@w <3> #4m7
x. x.. % %`;

    onLoadFile(syntaxChart, 'help-syntax');
  };

  const handleShowUserGuide = () => {
    setShowHelpMenu(false);
    setShowUserGuide(true);
  };

  return (
    <>
      <div className="bg-gray-800 text-white shadow-lg no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold">🎵 MusicChart</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* File Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowFileMenu(!showFileMenu);
                    setShowSettingsMenu(false);
                    setShowHelpMenu(false);
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                >
                  📁 File
                </button>
                {showFileMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white text-gray-800 rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
                    <button
                      onClick={() => { onNewSong(); setShowFileMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      New Chart
                    </button>
                    <button
                      onClick={() => { setShowChartLibrary(true); setShowFileMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      Open Chart...
                    </button>
                    <button
                      onClick={() => { setShowSaveDialog(true); setShowFileMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      Save Chart
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLoadFromFile}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      Load from .txt
                    </button>
                    <button
                      onClick={handleSaveTxt}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      Export to .txt
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      Export to PDF
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <div className="px-4 py-2 text-xs text-gray-500 font-semibold">SETLISTS</div>
                    <button
                      onClick={handleCreateSetlist}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      Create New Setlist
                    </button>
                    <button
                      onClick={handleExportSetlist}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      Export Setlist
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <div className="px-4 py-2 text-xs text-gray-500 font-semibold">DATA</div>
                    <button
                      onClick={handleExportAllData}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      Export All Data
                    </button>
                    <button
                      onClick={handleImportData}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      Import Data
                    </button>
                  </div>
                )}
              </div>

              {/* Setlists Button */}
              <button
                onClick={() => {
                  setShowSetlistManager(true);
                  setShowFileMenu(false);
                  setShowSettingsMenu(false);
                  setShowHelpMenu(false);
                }}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                🎵 Setlists
              </button>

              {/* Help Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowHelpMenu(!showHelpMenu);
                    setShowFileMenu(false);
                    setShowSettingsMenu(false);
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                >
                  ❓ Help
                </button>
                {showHelpMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-white text-gray-800 rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
                    <button
                      onClick={handleShowSyntax}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      Syntax Reference
                    </button>
                    <button
                      onClick={handleShowUserGuide}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      User Guide
                    </button>
                  </div>
                )}
              </div>

              {/* Settings Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSettingsMenu(!showSettingsMenu);
                    setShowFileMenu(false);
                    setShowHelpMenu(false);
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                >
                  ⚙️ Settings
                </button>
                {showSettingsMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-white text-gray-800 rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
                    <div className="px-4 py-2 text-xs text-gray-500 font-semibold">APPEARANCE</div>
                    <button
                      onClick={() => { onToggleDarkMode(); setShowSettingsMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      {darkMode ? '✓ Dark Mode' : 'Light Mode'}
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <div className="px-4 py-2 text-xs text-gray-500 font-semibold">FONT FAMILY</div>
                    {[
                      { value: 'inter', label: 'Inter' },
                      { value: 'roboto', label: 'Roboto' },
                      { value: 'opensans', label: 'Open Sans' },
                      { value: 'lato', label: 'Lato' },
                      { value: 'system', label: 'System Default' }
                    ].map(font => (
                      <button
                        key={font.value}
                        onClick={() => { onFontFamilyChange(font.value); setShowSettingsMenu(false); }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 text-sm ${fontFamily === font.value ? 'bg-blue-50 text-blue-600' : ''}`}
                      >
                        {fontFamily === font.value ? '✓ ' : ''}{font.label}
                      </button>
                    ))}
                    <div className="border-t border-gray-200 my-1"></div>
                    <div className="px-4 py-2 text-xs text-gray-500 font-semibold">FONT SIZE</div>
                    {['small', 'normal', 'medium', 'big'].map(size => (
                      <button
                        key={size}
                        onClick={() => { onFontSizeChange(size); setShowSettingsMenu(false); }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 text-sm ${fontSize === size ? 'bg-blue-50 text-blue-600' : ''}`}
                      >
                        {size === fontSize ? '✓ ' : ''}{size.charAt(0).toUpperCase() + size.slice(1)}
                      </button>
                    ))}
                    <div className="border-t border-gray-200 my-1"></div>
                    <div className="px-4 py-2 text-xs text-gray-500 font-semibold">LAYOUT</div>
                    <button
                      onClick={() => { onToggleTwoColumn(); setShowSettingsMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      {twoColumnLayout ? '✓ ' : ''}Two Column Layout
                    </button>
                    <button
                      onClick={() => { onToggleFitToPage(); setShowSettingsMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      {fitToPage ? '✓ ' : ''}Fit to Page
                    </button>
                    <button
                      onClick={() => { onToggleLayoutGuide(); setShowSettingsMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      {showLayoutGuide ? '✓ ' : ''}Show Layout Guide
                    </button>
                    <button
                      onClick={() => { onToggleOptimizeForScreen(); setShowSettingsMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      {optimizeForScreen ? '✓ ' : ''}Optimize for Screen
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <div className="px-4 py-2 text-xs text-gray-500 font-semibold">ALIGNMENT</div>
                    {[
                      { value: 'left', label: 'Left' },
                      { value: 'center', label: 'Center' },
                      { value: 'right', label: 'Right' }
                    ].map(align => (
                      <button
                        key={align.value}
                        onClick={() => { onAlignmentChange(align.value); setShowSettingsMenu(false); }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 text-sm ${alignment === align.value ? 'bg-blue-50 text-blue-600' : ''}`}
                      >
                        {alignment === align.value ? '✓ ' : ''}{align.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nashville/Chord toggle */}
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

      {/* Modals */}
      <ChartLibrary
        isOpen={showChartLibrary}
        onClose={() => setShowChartLibrary(false)}
        onOpenChart={onLoadChart}
      />

      <SetlistManager
        isOpen={showSetlistManager}
        onClose={() => setShowSetlistManager(false)}
        onOpenSetlist={onOpenSetlist}
      />

      <SaveChartDialog
        isOpen={showSaveDialog}
        song={song}
        onClose={() => setShowSaveDialog(false)}
        onSaved={onChartSaved}
      />

      <UserGuideModal
        isOpen={showUserGuide}
        onClose={() => setShowUserGuide(false)}
      />

      {/* Export Setlist Dialog */}
      {showExportSetlistDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Export Setlist</h2>
              <button
                onClick={() => {
                  setShowExportSetlistDialog(false);
                  setSelectedSetlistIds([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                Select one or more setlists to export:
              </p>
              <div className="space-y-2">
                {availableSetlists.map(setlist => (
                  <label
                    key={setlist.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSetlistIds.includes(setlist.id)}
                      onChange={() => toggleSetlistSelection(setlist.id)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        📋 {setlist.name}
                        {setlist.isDefault && (
                          <span className="ml-2 text-sm text-gray-500">(Default)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {setlistChartCounts[setlist.id] || 0} {setlistChartCounts[setlist.id] === 1 ? 'song' : 'songs'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedSetlistIds.length > 0 ? (
                  <span>{selectedSetlistIds.length} setlist{selectedSetlistIds.length > 1 ? 's' : ''} selected</span>
                ) : (
                  <span>No setlists selected</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowExportSetlistDialog(false);
                    setSelectedSetlistIds([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmExportSetlist}
                  disabled={selectedSetlistIds.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
