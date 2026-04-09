
// Helper component: Checkbox
export const Checkbox = ({ checked, onChange }: { checked: boolean; onChange: () => void })  => {
  return (
    <button
      onClick={onChange}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
        checked ? 'bg-[#cd5000] border-[#cd5000]' : 'border-gray-400 bg-white'
      }`}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}