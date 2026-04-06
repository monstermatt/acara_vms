
'use client';

import { useState } from 'react';
import { MessageIcon } from '@/icons';


// A template has an ID, a title and also a message body
interface AuditTemplate {
  id: number;
  volunteer_name: string;
  n_appointments: number;
  n_substituted_percentage: number;
  on_time_percentage: number;
}


// Sample data (hint: replace with real API calls once backend is ready)
const INITIAL_TEMPLATES: AuditTemplate[] = [
  { id: 1, volunteer_name: 'Jonh Black', n_appointments: 5, n_substituted_percentage: 20, on_time_percentage: 75 },
  { id: 2, volunteer_name: 'Emily White', n_appointments: 10, n_substituted_percentage: 10, on_time_percentage: 90 },
];



// Helper component: Checkbox
function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
        checked ? 'bg-[#cd5000] border-[#cd5000]' : 'border-gray-400 bg-white'
      }`}
    >


      {/* Show checkmark only when it is selected */}
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}



// This is the Main page component 
export default function AuditView() {
  
  // All templates are now in state (later: fetch from Django API)
  const [templates, setTemplates] = useState<AuditTemplate[]>(INITIAL_TEMPLATES);

  //setting of template IDs that are currently checked
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  //search text for filtering the table
  const [searchText, setSearchText] = useState('');

  //Filter templates based on the Search input 
  const filteredTemplates = templates.filter(
    (t) =>
      t.volunteer_name.toLowerCase().includes(searchText.toLowerCase())
  );


  // Toggle a single row checkbox
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };


  // Toggle the header checkbox (select all OR deselect all)
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTemplates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTemplates.map((t) => t.id)));
    }
  };

  const allSelected = filteredTemplates.length > 0 && selectedIds.size === filteredTemplates.length;

  // Some CRUD handlers 

  
  // Deletion of   all checked templates
  const handleDelete = () => {
    setTemplates((prev) => prev.filter((t) => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
  };

  //Open the edit modal for a specific template
  
  const openMessage = (template: AuditTemplate) => {
    console.log('Open Message Modal for template:', template);
    // setEditingTemplate(template);
    // setModalMode('edit');
  };
  

  return (
    <div className="p-8">

      {/* ── Table container ── */}
      <div className="table-container p-6">

        {/* Table toolbar: title, delete button (conditional), search */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">All Audits</h2>

          <div className="flex items-center gap-3">

            {/* Delete button — only visible when at least one row is checked */}
            {selectedIds.size > 0 && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-red-500 text-sm font-medium hover:text-red-700 transition-colors cursor-pointer"
              >
                {/* Trash icon (inline SVG — no extra import needed) */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
                Delete
              </button>
            )}

            {/* Divider between Delete and Search */}
            {selectedIds.size > 0 && <div className="h-5 w-px bg-gray-300" />}

            {/* Search input */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-8 pr-4 py-2 border border-gray-300 rounded-full text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9f0059] w-48"
              />
            </div>
          </div>
        </div>


        {/* ── Data table ── */}
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fdf5ee]">
                {/* Header checkbox: selects / deselects all rows */}
                <th className="w-12 px-4 py-3 text-left">
                  <Checkbox checked={allSelected} onChange={toggleSelectAll} />
                </th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Volunteer</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold"># Appointments</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold"># Substituted</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">On Time %</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Actions</th>

              </tr>
            </thead>
            <tbody>
              {/* Show a message when no templates match the search */}
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No templates found.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">

                    {/* Row checkbox */}
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={selectedIds.has(template.id)}
                        onChange={() => toggleSelect(template.id)}
                      />
                    </td>

                    {/* Volunteer Name */}
                    <td className="px-4 py-4 text-gray-800 font-medium w-1/3">
                      {template.volunteer_name}
                    </td>

                    {/* Number of Appointments */}
                    <td className="px-4 py-4 text-gray-500">
                      {template.n_appointments}
                    </td>

                    {/* Number of Substituted */}
                    <td className="px-4 py-4 text-gray-500">
                      {template.n_substituted_percentage}%
                    </td>

                    {/* On Time Percentage */}
                    <td className="px-4 py-4 text-gray-500">
                      {template.on_time_percentage}%
                    </td>

                    {/* Edit button opens the Edit modal */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => openMessage(template)}
                        className="flex items-center gap-1.5 text-gray-600 hover:text-[#9f0059] transition-colors cursor-pointer text-sm"
                      >
                        {/* Message icon */}
                        <MessageIcon className="w-5 h-5" />
                        Message
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>     
    </div>
  );
}
