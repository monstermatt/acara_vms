interface FilterModalProps {
  filters: any; 
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onClose: () => void;
  onReset: () => void;
}

export default function FilterModal({ filters, onFilterChange, onClose, onReset }: FilterModalProps) {
  return (
    <div 
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      onClick={onClose}
    >
      <div 
        className='bg-white p-8 rounded-lg max-w-md relative'
        onClick={(e) => e.stopPropagation()} 
      >
        <button
          className='absolute top-4 right-4 text-gray-500 hover:text-black'
          onClick={onClose}
        >
          x
        </button>

        <section className="input-section">
          <div>
            <h2 className='page-header'>Add A Filter</h2>
            
            <input
              className="input-style mb-3 block w-full"
              type="text"
              name="name"
              placeholder="Filter by name"
              value={filters.name}
              onChange={onFilterChange}
            />

            <select
              className="input-style mb-3 block w-full"
              name="gender"
              value={filters.gender}
              onChange={onFilterChange}
            >
              <option value="">All genders</option>
              <option value="F">Female</option>
              <option value="M">Male</option>
              <option value="O">Non-binary</option>
            </select>

            <select
              className="input-style mb-3 block w-full"
              name="preferences"
              value={filters.preferences}
              onChange={onFilterChange}
            >
              <option value="">All preferences</option>
              <option value="Office">Office</option>
              <option value="facility">Facility</option>
              <option value="Patient">Patient</option>
            </select>

            <input
              className="input-style mb-3 block w-full"
              type="number"
              min="0"
              name="travelDistance"
              placeholder="Max travel distance"
              value={filters.travelDistance}
              onChange={onFilterChange}
            />

            <input
              className="input-style mb-3 block w-full"
              type="text"
              name="skill"
              placeholder="Filter by skills"
              value={filters.skill}
              onChange={onFilterChange}
            />

            <select
              className="input-style mb-3 block w-full"
              name="team"
              value={filters.team}
              onChange={onFilterChange}
              >
              <option value="">All teams</option>
              <option value="A">Team A</option>
              <option value="B">Team B</option>
              <option value="C">Team C</option>
            </select>
          </div>

          <div className="mt-4">
            <button className="active-button" onClick={onReset}>
              Reset 
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}