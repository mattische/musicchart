interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">MusicChart User Guide</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Getting Started</h3>
            <p className="text-gray-700 mb-2">
              MusicChart is a tool for creating Nashville Number System chord charts.
              The Nashville Number System uses numbers (1-7) to represent chords based on scale degrees,
              making it easy to transpose songs to different keys.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Creating Charts</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Metadata:</strong> Start your chart with metadata like title, key, tempo, and meter.</p>
              <p className="pl-4 font-mono text-sm bg-gray-50 p-2 rounded">
                Title: My Song<br/>
                Key: C<br/>
                Tempo: 120<br/>
                Meter: 4/4
              </p>
              <p><strong>Sections:</strong> Use square brackets to define sections like [Verse], [Chorus], [Bridge], etc.</p>
              <p><strong>Chords:</strong> Write chords as numbers (1-7) with optional qualities (M, m, 7, M7, m7, sus4, etc.).</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">File Operations</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>New Chart:</strong> Click File → New Chart to start a fresh chart.</p>
              <p><strong>Save Chart:</strong> Click File → Save Chart to save your chart to the local library.</p>
              <p><strong>Open Chart:</strong> Click File → Open Chart to load a previously saved chart.</p>
              <p><strong>Export:</strong> Export your chart as a .txt file or PDF using the File menu.</p>
              <p><strong>Import:</strong> Load charts from .txt files using File → Load from .txt.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Setlists</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Create Setlist:</strong> Click File → Create New Setlist to create a collection of charts.</p>
              <p><strong>Manage Setlists:</strong> Click the Setlists button to view, edit, and organize your setlists.</p>
              <p><strong>Live Mode:</strong> Open a setlist and use arrow keys or swipe gestures to navigate between songs during performance.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Display Modes</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Nashville Mode (123):</strong> Display chords as numbers (default).</p>
              <p><strong>Chord Mode (ABC):</strong> Display chords as letter names based on the key.</p>
              <p><strong>Two Column Layout:</strong> Automatically split charts into two columns with 4 chords per line.</p>
              <p><strong>Fit to Page:</strong> Optimize chart size for printing on a single page.</p>
              <p><strong>Font Size:</strong> Choose from Small, Normal, Medium, or Big font sizes in Settings.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Data Management</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Export All Data:</strong> Save all your charts and setlists to a JSON file for backup.</p>
              <p><strong>Import Data:</strong> Restore charts and setlists from a previously exported JSON file.</p>
              <p><strong>Local Storage:</strong> All data is stored locally in your browser.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Tips</h3>
            <div className="space-y-2 text-gray-700">
              <p>• Use the Syntax Reference (Help → Syntax Reference) to see all available notation symbols.</p>
              <p>• Charts auto-save when you have previously saved them to the library.</p>
              <p>• Use % symbols to repeat the previous chord.</p>
              <p>• Use * to create visual separators between sections.</p>
              <p>• Enclose chords in &lt; &gt; to create diamond-shaped chord symbols.</p>
              <p>• Add @ after a chord number for anticipation/push markings.</p>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
