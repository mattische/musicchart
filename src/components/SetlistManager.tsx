import { useState, useEffect } from 'react';
import { Song } from '../types/song';
import { Setlist } from '../db/database';
import {
  getAllSetlists,
  createSetlist,
  updateSetlist,
  deleteSetlist,
  getChartsInSetlist,
  removeChartFromSetlist,
  updateSetlistItemOrder,
  getAllCharts,
  addChartToSetlist
} from '../db/operations';

interface SetlistManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSetlist: (setlist: Setlist) => void;
}

export default function SetlistManager({ isOpen, onClose, onOpenSetlist }: SetlistManagerProps) {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [editingSetlist, setEditingSetlist] = useState<Setlist | null>(null);
  const [editingCharts, setEditingCharts] = useState<Song[]>([]);
  const [editingName, setEditingName] = useState('');
  const [showAddCharts, setShowAddCharts] = useState(false);
  const [availableCharts, setAvailableCharts] = useState<Song[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSetlists();
    }
  }, [isOpen]);

  const loadSetlists = async () => {
    const all = await getAllSetlists();
    setSetlists(all);
  };

  const handleEditSetlist = async (setlist: Setlist) => {
    setEditingSetlist(setlist);
    setEditingName(setlist.name);
    const charts = await getChartsInSetlist(setlist.id);
    setEditingCharts(charts);

    // Load available charts
    const allCharts = await getAllCharts();
    const currentChartIds = new Set(charts.map(c => c.id));
    const available = allCharts.filter(c => !currentChartIds.has(c.id));
    setAvailableCharts(available);
  };

  const handleAddChartsToSetlist = async (chartIds: string[]) => {
    if (!editingSetlist) return;

    for (const chartId of chartIds) {
      await addChartToSetlist(chartId, editingSetlist.id);
    }

    // Reload charts
    const charts = await getChartsInSetlist(editingSetlist.id);
    setEditingCharts(charts);

    // Update available charts
    const allCharts = await getAllCharts();
    const currentChartIds = new Set(charts.map(c => c.id));
    const available = allCharts.filter(c => !currentChartIds.has(c.id));
    setAvailableCharts(available);

    setShowAddCharts(false);
  };

  const handleSaveEdit = async () => {
    if (!editingSetlist) return;

    if (editingName.trim() !== editingSetlist.name) {
      await updateSetlist(editingSetlist.id, editingName.trim());
    }

    // Update order based on current editingCharts array
    const chartIds = editingCharts.map(c => c.id);
    await updateSetlistItemOrder(editingSetlist.id, chartIds);

    setEditingSetlist(null);
    await loadSetlists();
  };

  const handleDeleteSetlist = async (setlist: Setlist) => {
    if (setlist.isDefault) {
      alert('Cannot delete default setlist');
      return;
    }

    if (!confirm(`Delete setlist "${setlist.name}"?`)) return;

    await deleteSetlist(setlist.id);
    await loadSetlists();
  };

  const handleCreateNewSetlist = async () => {
    if (!newSetlistName.trim()) {
      alert('Please enter a name for the new setlist');
      return;
    }

    await createSetlist(newSetlistName.trim());
    setNewSetlistName('');
    setShowCreateNew(false);
    await loadSetlists();
  };

  const handleRemoveChart = async (chartId: string) => {
    if (!editingSetlist) return;

    await removeChartFromSetlist(chartId, editingSetlist.id);
    const newCharts = editingCharts.filter(c => c.id !== chartId);
    setEditingCharts(newCharts);

    // Update order in database immediately
    const chartIds = newCharts.map(c => c.id);
    await updateSetlistItemOrder(editingSetlist.id, chartIds);
  };

  const moveChart = (index: number, direction: 'up' | 'down') => {
    setEditingCharts((prevCharts) => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prevCharts.length) return prevCharts;

      const newCharts = [...prevCharts];
      [newCharts[index], newCharts[newIndex]] = [newCharts[newIndex], newCharts[index]];
      return newCharts;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setEditingCharts((prevCharts) => {
      const newCharts = [...prevCharts];
      const [removed] = newCharts.splice(draggedIndex, 1);
      newCharts.splice(dropIndex, 0, removed);
      return newCharts;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (!isOpen) return null;

  // Add charts dialog
  if (showAddCharts && editingSetlist) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              Add Charts to {editingSetlist.name}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {availableCharts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No more charts available. All charts are already in this setlist!
              </p>
            ) : (
              <div className="space-y-2">
                {availableCharts.map(chart => (
                  <button
                    key={chart.id}
                    onClick={() => handleAddChartsToSetlist([chart.id])}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                  >
                    <div>
                      <div className="font-medium text-gray-800">
                        {chart.metadata.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        Key: {chart.metadata.key}
                        {chart.metadata.tempo && ` • ${chart.metadata.tempo} BPM`}
                        {chart.metadata.style && ` • ${chart.metadata.style}`}
                      </div>
                    </div>
                    <span className="text-green-600 font-bold text-xl">+</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => setShowAddCharts(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Editing mode
  if (editingSetlist) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              Edit: {editingSetlist.name}
            </h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Setlist Name
              </label>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={editingSetlist.isDefault}
              />
            </div>

            {/* Charts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Charts in this setlist ({editingCharts.length})
              </label>
              {editingCharts.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No charts in this setlist</p>
              ) : (
                <div className="space-y-2">
                  {editingCharts.map((chart, index) => (
                    <div
                      key={chart.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all bg-white ${
                        draggedIndex === index
                          ? 'opacity-50 border-blue-400'
                          : dragOverIndex === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Drag handle icon */}
                      <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                        </svg>
                      </div>

                      {/* Order controls */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveChart(index, 'up')}
                          disabled={index === 0}
                          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          <span className="text-gray-600 font-bold">↑</span>
                        </button>
                        <button
                          onClick={() => moveChart(index, 'down')}
                          disabled={index === editingCharts.length - 1}
                          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                        >
                          <span className="text-gray-600 font-bold">↓</span>
                        </button>
                      </div>

                      {/* Position number */}
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 font-bold rounded-full text-sm">
                        {index + 1}
                      </div>

                      {/* Chart info */}
                      <div className="flex-1">
                        <div className="text-gray-800 font-medium">
                          {chart.metadata.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          Key: {chart.metadata.key}
                          {chart.metadata.tempo && ` • ${chart.metadata.tempo} BPM`}
                          {chart.metadata.style && ` • ${chart.metadata.style}`}
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveChart(chart.id)}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors text-sm font-medium"
                        title="Remove from setlist"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => setShowAddCharts(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Add Charts
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingSetlist(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List mode
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">🎵 Manage Setlists</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Create New Setlist Section */}
          <div className="mb-6">
            {!showCreateNew ? (
              <button
                onClick={() => setShowCreateNew(true)}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span>
                <span>Create New Setlist</span>
              </button>
            ) : (
              <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Setlist Name
                </label>
                <input
                  type="text"
                  value={newSetlistName}
                  onChange={(e) => setNewSetlistName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewSetlist();
                    }
                  }}
                  placeholder="Enter setlist name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateNewSetlist}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateNew(false);
                      setNewSetlistName('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Existing Setlists */}
          <div className="space-y-3">
            {setlists.map(setlist => (
              <div
                key={setlist.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <span className="text-lg font-medium text-gray-800">
                    📋 {setlist.name}
                    {setlist.isDefault && (
                      <span className="ml-2 text-sm text-gray-500">(Default)</span>
                    )}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onOpenSetlist(setlist);
                      onClose();
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleEditSetlist(setlist)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Edit
                  </button>
                  {!setlist.isDefault && (
                    <button
                      onClick={() => handleDeleteSetlist(setlist)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
