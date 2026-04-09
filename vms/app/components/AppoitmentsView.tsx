'use client';

import { useState } from 'react';
import { MessageIcon } from '@/icons';

import { Checkbox } from './Utils/Checkbox';
import { StatusDropdown } from './Utils/AppoitmentStatusDropdown';
import { EditIcon, DeleteIcon } from '@/icons';

// Appointment template interface
interface AppointmentTemplate {
  id: number;
  volunteer_name: string;
  volunteer_phone: string;
  appoitment_time: string;
  appointment_status: string;
}

// MARK: - Replace with data from API once backend is ready
const INITIAL_TEMPLATES: AppointmentTemplate[] = [
  {
    id: 1,
    volunteer_name: 'Jonh Black',
    volunteer_phone: '123-456-7890',
    appoitment_time: '2023-10-01 10:00',
    appointment_status: '',
  },
  {
    id: 2,
    volunteer_name: 'Emily White',
    volunteer_phone: '098-765-4321',
    appoitment_time: '2023-10-02 14:00',
    appointment_status: '',
  },
];

export default function AppointmentsView() {
  const [templates, setTemplates] = useState<AppointmentTemplate[]>(INITIAL_TEMPLATES);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchText, setSearchText] = useState('');

  const filteredTemplates = templates.filter((t) =>
    t.volunteer_name.toLowerCase().includes(searchText.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTemplates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTemplates.map((t) => t.id)));
    }
  };

  const allSelected = filteredTemplates.length > 0 && selectedIds.size === filteredTemplates.length;

  const handleDelete = () => {
    //MARK: - Add API Request to delete templates by ID
    setTemplates((prev) => prev.filter((t) => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
  };

  const handleEdit = () => {
    //MARK: - Add API Request to edit templates by ID (e.g., open a modal with a form)
    console.log('Edit templates with IDs:', Array.from(selectedIds));
  }

  const openMessage = (template: AppointmentTemplate) => {
    console.log('Open Message Modal for template:', template);
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === id
          ? { ...template, appointment_status: newStatus }
          : template
      )
    );
  };

  return (
    <div className="pt-4">
      <div className="table-container p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">All Appointments</h2>

          <div className="flex items-center gap-3">

            {selectedIds.size > 0 && (  
            <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors cursor-pointer"
              >
                <EditIcon className="w-4 h-4 shrink-0" />
                <span className='text-gray-700'>Edit</span>
              </button>

            )}

            {selectedIds.size > 0 && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-red-500 text-sm font-medium hover:text-red-700 transition-colors cursor-pointer"
              >
                  <DeleteIcon className="w-4 h-4 shrink-0" />
                <span className='text-red-700'>Delete</span>
              </button>

            )}
  

            {selectedIds.size > 0 && <div className="h-5 w-px bg-gray-300" />}

            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
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

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fdf5ee]">
                <th className="w-12 px-4 py-3 text-left">
                  <Checkbox checked={allSelected} onChange={toggleSelectAll} />
                </th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Volunteer</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Phone</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Time</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">
                  Appointment Status
                </th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No templates found.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr
                    key={template.id}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={selectedIds.has(template.id)}
                        onChange={() => toggleSelect(template.id)}
                      />
                    </td>

                    <td className="px-4 py-4 text-gray-800 font-medium w-1/3">
                      {template.volunteer_name}
                    </td>

                    <td className="px-4 py-4 text-gray-500">{template.volunteer_phone}</td>

                    <td className="px-4 py-4 text-gray-500">{template.appoitment_time}</td>

                    <td className="px-4 py-4">
                      <StatusDropdown
                        value={template.appointment_status}
                        onChange={(newStatus) => handleStatusChange(template.id, newStatus)}
                      />
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() => openMessage(template)}
                        className="flex items-center gap-1.5 text-gray-600 hover:text-[#9f0059] transition-colors cursor-pointer text-sm"
                      >
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