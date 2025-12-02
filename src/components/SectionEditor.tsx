import { useRef } from 'react';
import { Section, Measure } from '../types/song';
import TextMeasureEditor from './TextMeasureEditor';

interface SectionEditorProps {
  section: Section;
  nashvilleMode: boolean;
  songKey: string;
  onUpdate: (section: Section) => void;
  onDelete: () => void;
}

export default function SectionEditor({
  section,
  nashvilleMode,
  songKey,
  onUpdate,
  onDelete,
}: SectionEditorProps) {
  const measureRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const updateMeasure = (measureId: string, updatedMeasure: Measure) => {
    onUpdate({
      ...section,
      measures: section.measures.map((m) =>
        m.id === measureId ? updatedMeasure : m
      ),
    });
  };

  const addMeasure = () => {
    const newMeasure: Measure = {
      id: `measure-${Date.now()}`,
      chords: [],
      rawText: '',
    };
    onUpdate({
      ...section,
      measures: [...section.measures, newMeasure],
    });
  };

  const deleteMeasure = (measureId: string) => {
    if (section.measures.length <= 1) {
      alert('Section must have at least one measure');
      return;
    }
    onUpdate({
      ...section,
      measures: section.measures.filter((m) => m.id !== measureId),
    });
  };

  const handleNavigate = (fromMeasureId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    const currentIndex = section.measures.findIndex((m) => m.id === fromMeasureId);
    let targetIndex = currentIndex;

    // Calculate number of columns based on screen width
    const cols = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 2 : 1;

    switch (direction) {
      case 'left':
        if (currentIndex > 0) targetIndex = currentIndex - 1;
        break;
      case 'right':
        if (currentIndex < section.measures.length - 1) {
          targetIndex = currentIndex + 1;
        } else {
          // At the end, create new measure
          addMeasure();
          return;
        }
        break;
      case 'up':
        targetIndex = Math.max(0, currentIndex - cols);
        break;
      case 'down':
        targetIndex = Math.min(section.measures.length - 1, currentIndex + cols);
        break;
    }

    // Focus the target measure's input
    const targetMeasure = section.measures[targetIndex];
    if (targetMeasure) {
      const element = measureRefs.current.get(targetMeasure.id);
      if (element) {
        const input = element.querySelector('input');
        input?.focus();
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="border border-gray-300 rounded-md px-4 py-2 bg-gray-50">
          <input
            type="text"
            value={section.name}
            onChange={(e) => onUpdate({ ...section, name: e.target.value })}
            className="text-2xl font-bold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0"
            placeholder="Section name (e.g., V:, C:)"
          />
        </div>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 px-3 py-1 rounded hover:bg-red-50 transition-colors"
        >
          Delete Section
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {section.measures.map((measure) => (
          <div
            key={measure.id}
            ref={(el) => {
              if (el) measureRefs.current.set(measure.id, el);
              else measureRefs.current.delete(measure.id);
            }}
          >
            <TextMeasureEditor
              measure={measure}
              nashvilleMode={nashvilleMode}
              songKey={songKey}
              onUpdate={(updatedMeasure) => updateMeasure(measure.id, updatedMeasure)}
              onDelete={() => deleteMeasure(measure.id)}
              onNavigate={(direction) => handleNavigate(measure.id, direction)}
            />
          </div>
        ))}
      </div>

      <button
        onClick={addMeasure}
        className="mt-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-300 hover:border-blue-400"
      >
        + Add Measure
      </button>
    </div>
  );
}
