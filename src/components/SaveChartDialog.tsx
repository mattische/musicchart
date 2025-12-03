import { useState, useEffect } from 'react';
import { Song } from '../types/song';
import { Setlist } from '../db/database';
import { saveChart, getAllSetlists, addChartToSetlist, getSetlistsForChart } from '../db/operations';

interface SaveChartDialogProps {
  isOpen: boolean;
  song: Song;
  onClose: () => void;
  onSaved: (chartId: string) => void;
}

export default function SaveChartDialog({ isOpen, song, onClose, onSaved }: SaveChartDialogProps) {
  const [title, setTitle] = useState('');
  const [key, setKey] = useState('C');
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [selectedSetlists, setSelectedSetlists] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, song]);

  const loadData = async () => {
    setTitle(song.metadata.title);
    setKey(song.metadata.key);

    const allSetlists = await getAllSetlists();
    setSetlists(allSetlists);

    // Pre-select setlists that this chart is already in
    const existingSetlists = await getSetlistsForChart(song.id);
    setSelectedSetlists(new Set(existingSetlists.map(s => s.id)));

    // If no setlists selected, select default
    if (existingSetlists.length === 0) {
      const defaultSetlist = allSetlists.find(s => s.isDefault);
      if (defaultSetlist) {
        setSelectedSetlists(new Set([defaultSetlist.id]));
      }
    }
  };

  const toggleSetlist = (setlistId: string) => {
    const newSelected = new Set(selectedSetlists);
    if (newSelected.has(setlistId)) {
      newSelected.delete(setlistId);
    } else {
      newSelected.add(setlistId);
    }
    setSelectedSetlists(newSelected);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    // Update song metadata
    const updatedSong: Song = {
      ...song,
      metadata: {
        ...song.metadata,
        title: title.trim(),
        key: key.trim()
      }
    };

    // Save chart
    const chartId = await saveChart(updatedSong);

    // Add to selected setlists
    for (const setlistId of selectedSetlists) {
      await addChartToSetlist(chartId, setlistId);
    }

    onSaved(chartId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">💾 Save Chart</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Song title"
            />
          </div>

          {/* Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key
            </label>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'].map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Setlists */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add to Setlists
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {setlists.map(setlist => (
                <label key={setlist.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSetlists.has(setlist.id)}
                    onChange={() => toggleSetlist(setlist.id)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-800">
                    {setlist.name}
                    {setlist.isDefault && <span className="text-gray-500 text-sm ml-1">(Default)</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Chart
          </button>
        </div>
      </div>
    </div>
  );
}
