import { SongMetadata } from '../types/song';

interface PrintHeaderProps {
  metadata: SongMetadata;
}

export default function PrintHeader({ metadata }: PrintHeaderProps) {
  return (
    <div className="hidden print:block mb-4">
      <h1 className="text-2xl font-bold text-black mb-1">{metadata.title}</h1>
      <div className="flex gap-6 text-sm text-gray-700 flex-wrap">
        <div>
          <strong>Key:</strong> {metadata.key}
        </div>
        {metadata.tempo && (
          <div>
            <strong>Tempo:</strong> {metadata.tempo} BPM
          </div>
        )}
        {metadata.timeSignature && (
          <div>
            <strong>Meter:</strong> {metadata.timeSignature}
          </div>
        )}
        {metadata.style && (
          <div>
            <strong>Style:</strong> {metadata.style}
          </div>
        )}
        {metadata.feel && (
          <div>
            <strong>Feel:</strong> {metadata.feel}
          </div>
        )}
        {metadata.customProperties && Object.keys(metadata.customProperties).length > 0 && (
          <>
            {Object.entries(metadata.customProperties).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {value}
              </div>
            ))}
          </>
        )}
      </div>
      <div className="border-b-2 border-black mt-2 mb-3"></div>
    </div>
  );
}
