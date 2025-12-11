import { NavigationMarker } from '../types/song';

interface NavigationMarkerDisplayProps {
  marker: NavigationMarker;
}

export default function NavigationMarkerDisplay({ marker }: NavigationMarkerDisplayProps) {
  // Render symbols (§ and ⊕) without background box
  if (marker.type === 'segno') {
    return (
      <div className="flex justify-center items-start my-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 print:text-gray-900" style={{ lineHeight: '1' }}>
          §
        </span>
      </div>
    );
  }

  if (marker.type === 'coda') {
    return (
      <div className="flex justify-center items-start my-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 print:text-gray-900" style={{ lineHeight: '1' }}>
          ⊕
        </span>
      </div>
    );
  }

  // Render text markers in yellow box
  const getMarkerText = (): string => {
    switch (marker.type) {
      case 'ds':
        return 'D.S.';
      case 'ds-al-fine':
        return 'D.S. al Fine';
      case 'ds-al-coda':
        return 'D.S. al Coda';
      case 'dc':
        return 'D.C.';
      case 'dc-al-fine':
        return 'D.C. al Fine';
      case 'dc-al-coda':
        return 'D.C. al Coda';
      case 'fine':
        return 'Fine';
      case 'to-coda':
        return 'To Coda';
      default:
        return marker.text || '';
    }
  };

  return (
    <div className="flex justify-center my-2">
      <div className="inline-block bg-yellow-100 dark:bg-yellow-900 print:bg-yellow-100 border border-yellow-400 dark:border-yellow-600 print:border-yellow-400 rounded px-3 py-1">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 print:text-gray-900">
          {getMarkerText()}
        </span>
      </div>
    </div>
  );
}
