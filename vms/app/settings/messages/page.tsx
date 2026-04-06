'use client';


import { useState } from 'react';


// A template has an ID, a title and also a message body
interface Template {
  id: number;
  title: string;
  message: string;
}

// which modal should be shown? null means none
type ModalMode = 'create' | 'edit' | null;

// Sample data (hint: replace with real API calls once backend is ready)

const INITIAL_TEMPLATES: Template[] = [
  { id: 1, title: 'Hey, are you interested?', message: 'To ask volunteer, if task is possible to take on. Please let us know if you are available this week.' },
  { id: 2, title: 'Reminder: EMR!', message: 'Reminder for volunteers for EMR documentation. Please complete your EMR charting within 24 hours of your visit.' },
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

// helper component: Modal (used for both Create and Edit)

interface ModalProps {
  mode: 'create' | 'edit';
  initialTitle?: string;
  initialMessage?: string;
  onSave: (title: string, message: string) => void;
  onCancel: () => void;
}

function TemplateModal({ mode, initialTitle = '', initialMessage = '', onSave, onCancel }: ModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [message, setMessage] = useState(initialMessage);

  const isCreate = mode === 'create';

  return (
    // Dark overlay behind this modal
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 p-8 shadow-xl">

        {/* Modal heading change depending on the mode */}
        <h2 className="text-2xl font-bold text-[#9f0059] mb-1">
          {isCreate ? 'Create Template' : 'Edit Template'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {isCreate
            ? 'Fill in the form to create a new message template'
            : 'Edit the form to modify a message template'}
        </p>

        {/* Title input */}
        <label className="block text-sm font-semibold text-gray-800 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Type something..."
          className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9f0059] mb-5"
        />

        {/* Message textarea */}
        <label className="block text-sm font-semibold text-gray-800 mb-1">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type something..."
          rows={7}
          className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9f0059] resize-none mb-8"
        />


        {/* Cancel and Save buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-8 py-3 rounded-full border border-[#9f0059] text-[#9f0059] text-sm font-medium hover:bg-[#f6f0eb] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Only save if both fields have content
              if (title.trim() && message.trim()) {
                onSave(title.trim(), message.trim());
              }
            }}
            className="px-8 py-3 rounded-full bg-[#9f0059] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// This is the Main page component 

export default function MessagesPage() {
  
  // All templates are now in state (later: fetch from Django API)
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);

  //setting of template IDs that are currently checked
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  //search text for filtering the table
  const [searchText, setSearchText] = useState('');

  //which modal is open: null = none, 'create' = new, 'edit' = editing
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  // The template  being currentlyedited
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Auto-incrementing ID (in a real app this comes from the backend)
  const [nextId, setNextId] = useState(3);

  //Filter templates based on the Search input 

  const filteredTemplates = templates.filter(
    (t) =>
      t.title.toLowerCase().includes(searchText.toLowerCase()) ||
      t.message.toLowerCase().includes(searchText.toLowerCase())
  );

  // The checkbox logic

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

  // To save a newly created template
  const handleCreate = (title: string, message: string) => {
    const newTemplate: Template = { id: nextId, title, message };
    setTemplates((prev) => [...prev, newTemplate]);
    setNextId((n) => n + 1);
    setModalMode(null);
  };

  // Too save changes to an existing template
  const handleEdit = (title: string, message: string) => {
    if (!editingTemplate) return;
    setTemplates((prev) =>
      prev.map((t) => (t.id === editingTemplate.id ? { ...t, title, message } : t))
    );
    setModalMode(null);
    setEditingTemplate(null);
  };

  // Deletion of   all checked templates
  const handleDelete = () => {
    setTemplates((prev) => prev.filter((t) => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
  };

  //Open the edit modal for a specific template
  const openEdit = (template: Template) => {
    setEditingTemplate(template);
    setModalMode('edit');
  };

  // Part: Render

  return (
    <div className="p-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#9f0059]">Message Template</h1>
          <p className="text-sm text-gray-500 mt-1">
            There {templates.length === 1 ? 'is' : 'are'} {templates.length} Message template{templates.length !== 1 ? 's' : ''} in the system
          </p>
        </div>

        {/* Button to open the Create modal */}
        <button
          onClick={() => setModalMode('create')}
          className="flex items-center gap-2 bg-[#9f0059] text-white px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          <span className="text-lg leading-none">+</span>
          Add New
        </button>
      </div>

      {/* ── Table container ── */}
      <div className="table-container p-6">

        {/* Table toolbar: title, delete button (conditional), search */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">All Templates</h2>

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
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Title</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Message</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Show a message when no templates match the search */}
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
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

                    {/* Title */}
                    <td className="px-4 py-4 text-gray-800 font-medium w-1/3">
                      {template.title}
                    </td>

                    {/* Message preview — truncated to 60 characters */}
                    <td className="px-4 py-4 text-gray-500">
                      {template.message.length > 60
                        ? template.message.slice(0, 60) + '...'
                        : template.message}
                    </td>

                    {/* Edit button opens the Edit modal */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => openEdit(template)}
                        className="flex items-center gap-1.5 text-gray-600 hover:text-[#9f0059] transition-colors cursor-pointer text-sm"
                      >
                        {/* Pencil icon (inline SVG) */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Create modal */}
      {modalMode === 'create' && (
        <TemplateModal
          mode="create"
          onSave={handleCreate}
          onCancel={() => setModalMode(null)}
        />
      )}

      {/* Edit modal — only renders when a template is selected for editing */}
      {modalMode === 'edit' && editingTemplate && (
        <TemplateModal
          mode="edit"
          initialTitle={editingTemplate.title}
          initialMessage={editingTemplate.message}
          onSave={handleEdit}
          onCancel={() => {
            setModalMode(null);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}
