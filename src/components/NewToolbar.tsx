import { useState } from 'react';
import { Song } from '../types/song';
import { Setlist } from '../db/database';
import { sectionsToChordText } from '../utils/jotChordParser';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ChartLibrary from './ChartLibrary';
import SetlistManager from './SetlistManager';
import SaveChartDialog from './SaveChartDialog';
import { exportAllData, importData } from '../db/operations';

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
  onLoadChart: (chart: Song) => void;
  onChartSaved: (chartId: string) => void;
  onOpenSetlist: (setlist: Setlist) => void;
  fontSize: string;
  onFontSizeChange: (size: string) => void;
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
  onFontSizeChange
}: ToolbarProps) {
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showSetlistsMenu, setShowSetlistsMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showChartLibrary, setShowChartLibrary] = useState(false);
  const [showSetlistManager, setShowSetlistManager] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

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

  const handleExportAllData = async () => {
    setShowSettingsMenu(false);
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `musicchart-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    setShowSettingsMenu(false);
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
            alert('Data imported successfully!');
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
                    setShowSetlistsMenu(false);
                    setShowSettingsMenu(false);
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
                  </div>
                )}
              </div>

              {/* Setlists Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSetlistsMenu(!showSetlistsMenu);
                    setShowFileMenu(false);
                    setShowSettingsMenu(false);
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                >
                  🎵 Setlists
                </button>
                {showSetlistsMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white text-gray-800 rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
                    <button
                      onClick={() => { setShowSetlistManager(true); setShowSetlistsMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      Manage Setlists...
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
                    setShowSetlistsMenu(false);
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                >
                  ⚙️ Settings
                </button>
                {showSettingsMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-white text-gray-800 rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
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
    </>
  );
}
