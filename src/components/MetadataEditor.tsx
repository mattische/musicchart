import { useState } from 'react';
import { SongMetadata } from '../types/song';

interface MetadataEditorProps {
  metadata: SongMetadata;
  onUpdate: (metadata: SongMetadata) => void;
}

export default function MetadataEditor({ metadata, onUpdate }: MetadataEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (field: keyof SongMetadata, value: string | number | undefined) => {
    onUpdate({
      ...metadata,
      [field]: value || undefined,
    });
  };

  const handleCustomPropertyChange = (key: string, value: string) => {
    const customProperties = { ...(metadata.customProperties || {}) };
    if (value.trim()) {
      customProperties[key] = value;
    } else {
      delete customProperties[key];
    }
    onUpdate({
      ...metadata,
      customProperties,
    });
  };

  const addCustomProperty = () => {
    const key = prompt('Enter property name (e.g., Artist, Genre):');
    if (key && key.trim()) {
      handleCustomPropertyChange(key.trim(), '');
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 no-print">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left font-semibold text-gray-800 hover:text-blue-600 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>📝</span>
          <span>Metadata</span>
        </span>
        <span className="text-xl">{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={metadata.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Song Title"
            />
          </div>

          {/* Key and Tempo in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Key
              </label>
              <input
                type="text"
                value={metadata.key || ''}
                onChange={(e) => handleChange('key', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="C"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tempo (BPM)
              </label>
              <input
                type="number"
                value={metadata.tempo || ''}
                onChange={(e) => handleChange('tempo', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="120"
              />
            </div>
          </div>

          {/* Time Signature and Style */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Meter
              </label>
              <input
                type="text"
                value={metadata.timeSignature || ''}
                onChange={(e) => handleChange('timeSignature', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="4/4"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Style
              </label>
              <input
                type="text"
                value={metadata.style || ''}
                onChange={(e) => handleChange('style', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Rock, Jazz..."
              />
            </div>
          </div>

          {/* Feel */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Feel
            </label>
            <input
              type="text"
              value={metadata.feel || ''}
              onChange={(e) => handleChange('feel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Swing, Straight..."
            />
          </div>

          {/* Custom Properties */}
          {metadata.customProperties && Object.keys(metadata.customProperties).length > 0 && (
            <div className="border-t border-gray-300 pt-3">
              <div className="text-xs font-medium text-gray-700 mb-2">Custom Properties</div>
              {Object.entries(metadata.customProperties).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {key}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleCustomPropertyChange(key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={() => handleCustomPropertyChange(key, '')}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                      title="Remove property"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Custom Property Button */}
          <button
            onClick={addCustomProperty}
            className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            + Add Custom Property
          </button>
        </div>
      )}
    </div>
  );
}
