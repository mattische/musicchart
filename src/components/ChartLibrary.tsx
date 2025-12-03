import { useState, useEffect } from 'react';
import { Song } from '../types/song';
import { getAllCharts, searchCharts, deleteChart, getChartsInSetlist, getAllSetlists } from '../db/operations';
import { Setlist } from '../db/database';

interface ChartLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChart: (chart: Song) => void;
}

export default function ChartLibrary({ isOpen, onClose, onOpenChart }: ChartLibraryProps) {
  const [charts, setCharts] = useState<Song[]>([]);
  const [filteredCharts, setFilteredCharts] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSetlist, setSelectedSetlist] = useState<string>('all');
  const [setlists, setSetlists] = useState<Setlist[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    filterCharts();
  }, [searchQuery, selectedSetlist, charts]);

  const loadData = async () => {
    const [allCharts, allSetlists] = await Promise.all([
      getAllCharts(),
      getAllSetlists()
    ]);
    setCharts(allCharts);
    setSetlists(allSetlists);
  };

  const filterCharts = async () => {
    let result = charts;

    // Filter by search query
    if (searchQuery.trim()) {
      result = await searchCharts(searchQuery);
    }

    // Filter by setlist
    if (selectedSetlist !== 'all') {
      const setlistCharts = await getChartsInSetlist(selectedSetlist);
      const setlistChartIds = new Set(setlistCharts.map(c => c.id));
      result = result.filter(c => setlistChartIds.has(c.id));
    }

    setFilteredCharts(result);
  };

  const handleDelete = async (chartId: string) => {
    if (!confirm('Are you sure you want to delete this chart?')) return;

    await deleteChart(chartId);
    await loadData();
  };

  const formatDate = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">📚 Chart Library</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 space-y-3">
          <input
            type="text"
            placeholder="Search charts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedSetlist}
            onChange={(e) => setSelectedSetlist(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Setlists</option>
            {setlists.map(setlist => (
              <option key={setlist.id} value={setlist.id}>
                {setlist.name}
              </option>
            ))}
          </select>
        </div>

        {/* Chart List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredCharts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No charts found. Create your first chart!
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCharts.map(chart => (
                <div
                  key={chart.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        ♪ {chart.metadata.title} - {chart.metadata.key}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Updated {formatDate(chart.updatedAt)}
                        {chart.metadata.style && ` • ${chart.metadata.style}`}
                        {chart.metadata.tempo && ` • ${chart.metadata.tempo} BPM`}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          onOpenChart(chart);
                          onClose();
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleDelete(chart.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
