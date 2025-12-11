interface LayoutGuideProps {
  isVisible: boolean;
}

export default function LayoutGuide({ isVisible }: LayoutGuideProps) {
  if (!isVisible) return null;

  const guides = [
    { name: 'A4 Width (210mm)', width: 794, color: 'bg-blue-500', borderColor: '#3b82f6' },
    { name: 'Mobile S (320px)', width: 320, color: 'bg-green-500', borderColor: '#22c55e' },
    { name: 'Mobile M (375px)', width: 375, color: 'bg-green-600', borderColor: '#16a34a' },
    { name: 'Mobile L (425px)', width: 425, color: 'bg-green-700', borderColor: '#15803d' },
    { name: 'Tablet (768px)', width: 768, color: 'bg-yellow-500', borderColor: '#eab308' },
    { name: 'Laptop (1024px)', width: 1024, color: 'bg-orange-500', borderColor: '#f97316' },
    { name: 'Desktop (1440px)', width: 1440, color: 'bg-red-500', borderColor: '#ef4444' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 no-print">
      {/* A4 Height guide (for print) */}
      <div
        className="absolute left-0 right-0 bg-blue-500 opacity-20"
        style={{ top: '100px', height: '1123px', border: '2px dashed #3b82f6' }}
      >
        <div className="absolute top-0 left-4 bg-blue-600 text-white text-sm px-3 py-2 rounded shadow-lg font-bold opacity-100">
          A4 Height (297mm / 1123px)
        </div>
      </div>

      {/* Vertical guides for widths */}
      {guides.map((guide) => (
        <div
          key={guide.name}
          className="absolute top-0 bottom-0"
          style={{
            left: `${guide.width}px`,
            width: '3px',
            background: guide.borderColor,
            opacity: 0.6,
            boxShadow: `0 0 10px ${guide.borderColor}`
          }}
        >
          <div
            className={`absolute top-4 -left-24 ${guide.color} text-white text-sm px-3 py-2 rounded shadow-lg font-bold whitespace-nowrap`}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'right center',
              opacity: 1
            }}
          >
            {guide.name}
          </div>
        </div>
      ))}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(#666 1px, transparent 1px), linear-gradient(90deg, #666 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
}
