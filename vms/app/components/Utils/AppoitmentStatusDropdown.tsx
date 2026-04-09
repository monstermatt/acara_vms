import { useEffect, useRef, useState } from 'react';

// Status options for the dropdown menu in the appointment status column
const STATUS_OPTIONS = [
  { label: 'Completed', value: 'Completed', textColor: 'text-green-600', border: 'border-green-600' },
  { label: 'Completed (late)', value: 'Completed (late)', textColor: 'text-amber-500', border: 'border-amber-500' },
  { label: 'Not Charted', value: 'Not Charted', textColor: 'text-red-500', border: 'border-red-500' },
];

function getStatusStyle(status: string) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.textColor || 'text-gray-700';
}

function getStatusBorder(status: string) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.border || 'border-gray-300';
}

export const StatusDropdown = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (newValue: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-[220px]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full bg-white border rounded-[20px] px-4 py-2 flex items-center justify-between text-left cursor-pointer ${getStatusBorder(value)}`}
      >
        <span className={`font-medium ${getStatusStyle(value)}`}>
          {value || 'Select Status'}
        </span>

        <svg
          className={`w-4 h-4 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 15L12 9L18 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] left-0 z-20 w-full bg-white border border-gray-300 rounded-[20px] shadow-lg overflow-hidden">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`block w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer font-medium ${option.textColor}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};