'use client';

//COMMENTS: useState lets us store data inside this component that can change over time.
//For example: the list of templates, what the user typed in the search box, etc.
//useEffect lets us running code at a specific moment -  here we use it to load
//templates from the backend as soon as the page opens.
import { useState, useEffect } from 'react';

// useSession gives us access to the currently logged-in user's session.
//Inside the session there is an "accessToken" that we must
//send with every API request so the backend knows taht we are allowed to do this.
import { useSession } from 'next-auth/react';

//This TypeScript interface describes the exact shape of one template object
//as it comes back from the Django REST API.
//IMPORTANT NOTE: The backend field names are different from what the UI labels say, which measn:
//template_type    → displayed as "Title"   in the table
//template_content → displayed as "Message" in the table
interface Template {
  id: number;               //unique number Django will assign automatically to every object
  template_type: string;    //the title of the template
  template_content: string; //the full message text/content of the template
}

//ModalMode tracks which popup window (modal) is currently open on screen.
//"create" = the user clicked "Add New"  -> shows the create form
//"edit"   = the user clicked "Edit"     ->show the edit form pre-filled
//"null"     = no modal open              ->show only the table
type ModalMode = 'create' | 'edit' | null;


// Checkbox is a small helper Component used in almost every table row and in the header row.
// checked  = true means that the box is ticked (filled orange), false means it is empty
// onChange = Function to call when the user clicks the checkbox (so toggles it)
function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
        checked ? 'bg-[#cd5000] border-[#cd5000]' : 'border-gray-400 bg-white'
      }`}
    >
      {/* Only render the checkmark SVG icon when the box is really ticked */}
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}




//ModalProps defines what Information the templateModal component needs to work with..
//So, both the <Create> and the <Edit> modal share this same component - the "mode" prop
// controls which version is shown here. 
interface ModalProps {
  mode: 'create' | 'edit';
  initialTitle?: string;    //only used in edit mode. So it pre-fills the Title field
  initialMessage?: string;  // Only used in edit mode — so it pre-fills the Message field
  onSave: (title: string, message: string) => void; // called when user clicks on "Save"
  onCancel: () => void;     //Called when User clicks "Cancel" -close the modal
}




// TemplateModal is the popup form used for both <creating> and <editing> a template.
//It has its own local state for the title and message input fields.
//When the user clicks Save, it calls onSave() with the current values.
function TemplateModal({ mode, initialTitle = '', initialMessage = '', onSave, onCancel }: ModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [message, setMessage] = useState(initialMessage);

  const isCreate = mode === 'create';

  return (
    //This dark semi-transparent overlay sits on top of everything else on the page
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 p-8 shadow-xl">


        {/* The heading and subtitle text change depending on whether we are creating or editing something */}
        <h2 className="text-2xl font-bold text-[#9f0059] mb-1">
          {isCreate ? 'Create Template' : 'Edit Template'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {isCreate
            ? 'Fill in the form to create a new message template'
            : 'Edit the form to modify a message template'}
        </p>

        {/* Title input field - this updates the local "title" state on every keystroke */}
        <label className="block text-sm font-semibold text-gray-800 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Type something..."
          className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9f0059] mb-5"
        />

        {/* Message textarea - this updates the local "message" state on every keystroke */}
        <label className="block text-sm font-semibold text-gray-800 mb-1">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type something..."
          rows={7}
          className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9f0059] resize-none mb-8"
        />

        {/* for cancel and  and the save button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-8 py-3 rounded-full border border-[#9f0059] text-[#9f0059] text-sm font-medium hover:bg-[#f6f0eb] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              //Only trigger onSave if the user actually typed something in both of the  fields.
              // .trim() is removing accidental leading or trailing spaces before checking.
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




// ─────────────────────────────────────────────
//THIS IS THE MAIN PAGE COMPONENT
// ─────────────────────────────────────────────



export default function MessagesPage() {

  //This measn: Get the current user session from NextAuth.
  //"session.accessToken " is the JWT token we need to send to the Django backend
  //with every API request so it knows we are authenticated.
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  //"templates" holds the list of templates fetched from the backend.
  //Starts as an empty array — gets filled once the API call completes.
  const [templates, setTemplates] = useState<Template[]>([]);

  //The "isLoading" is true while we are waiting for the API response.
  //Here, wee show a loading message to the user during this time.
  const [isLoading, setIsLoading] = useState(true);

  //"fetchError" stores an error message if the API call fails.
  //Here, we show this message to the user instead of an empty page.
  const [fetchError, setFetchError] = useState<string | null>(null);

  //"selectedIds" is a set of template IDs
  //which  the user has ticked with a checkbox. Used for the bulk Delete button.
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  //The "searchText" stores whatever the user types in the search box.
  //The table filters itself in real time based on this value.
  const [searchText, setSearchText] = useState('');

  //"modalMode" controls which modal is open right now (see ModalMode type above).
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  // The editingTemplate" stores the full template object the user clicked Edit on.
  //We need this one to pre-fill the Edit modal and to know which ID to PATCH.
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  //useEffect runs fetchTemplates once when the page first loads,
  //and again if the token changes (e.g. after the user logs in).
  //This replaces the old INITIAL_TEMPLATES dummy data — now we get real data from Django.
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!token) return; // do nothing if the user is not logged in yet

      try {
        setIsLoading(true);

        // GET /api/templates/ -  asking Django for all templates in the database.
        // The authorization header sends our JWT token so Django lets us in.
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/templates/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error(`Failed to fetch templates. (Status: ${response.status})`);

        const data = await response.json();


        // Django REST Framework can return either a plain array or a paginated object.
        // If paginated,the actual items are inside data.results.
        setTemplates(Array.isArray(data) ? data : data.results ?? []);

      } catch (err: any) {
        console.error(err);
        setFetchError(err.message);
      } finally {
        //Always set isLoading to false when done  - whether successful or not.
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [token]);

  //Filtering the templates array based on the search input.
  //This runs on every render - no API call needed, so it is  just client-side filtering.
  //It checks both the title (template_type) and the message (template_content).
  const filteredTemplates = templates.filter(
    (t) =>
      t.template_type.toLowerCase().includes(searchText.toLowerCase()) ||
      t.template_content.toLowerCase().includes(searchText.toLowerCase())
  );

  //Toggles the checkbox for one single row.
  //If the ID is already in the Set , then remove it. If not, then add it.
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  //Toggles the checkbox in the header row (select all &  deselect all).
  //If all visible rows are already selected → deselect all.
  // Otherwise  select all visible rows.
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTemplates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTemplates.map((t) => t.id)));
    }
  };



  // True only when every visible row is ticked - This is used to show the header checkbox as checked.
  const allSelected = filteredTemplates.length > 0 && selectedIds.size === filteredTemplates.length;

  // handleCreate: called when the user fills in the Create form and clicks Save.
  // Sends a POST request to Django to save the new template in the database.
  // On success, adds the returned object (with its real backend ID) to local state.
  const handleCreate = async (title: string, message: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/templates/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        //Mapping the the UI field names back to the backend field names before sending
        body: JSON.stringify({
          template_type: title,
          template_content: message,
        }),
      });
      if (!response.ok) throw new Error(`Failed to create template. (Status: ${response.status})`);
      const newTemplate = await response.json();
      //Adding  the newly created template (including its real ID from Django) to the list
      setTemplates((prev) => [...prev, newTemplate]);
    } catch (err) {
      console.error(err);
    }
    setModalMode(null); //close the modal regardless of success or failure
  };

  // handleEdit: called when the user edits a template and clicks Save.
  //Sends a PATCH request to Django to update only the changed fields.
  //On success, replaces the old version in local state with the updated one.
  const handleEdit = async (title: string, message: string) => {
    if (!editingTemplate || !token) return;
    try {
      const response = await fetch(
        //Including the template's ID in the URL so django knows which One to update
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/templates/${editingTemplate.id}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            template_type: title,
            template_content: message,
          }),
        }
      );
      if (!response.ok) throw new Error(`Failed to update template. (Status: ${response.status})`);
      const updated = await response.json();
      //replace the old template in the array with the updated version from the backend
      setTemplates((prev) =>
        prev.map((t) => (t.id === editingTemplate.id ? updated : t))
      );
    } catch (err) {
      console.error(err);
    }
    setModalMode(null);
    setEditingTemplate(null);
  };



  //handleDelete: called when the user clicks the red Delete button.
  //Sends one DELETE request per selected template (all in parallel using Promise.all).
  //On success, removes the deleted templates from local state.
  const handleDelete = async () => {
    if (!token) return;
    try {
      await Promise.all(
        [...selectedIds].map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/templates/${id}/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      //Remove all deleted templates from the local list
      setTemplates((prev) => prev.filter((t) => !selectedIds.has(t.id)));
      setSelectedIds(new Set()); // clear all checkboxes
    } catch (err) {
      console.error(err);
    }
  };

  //openEdit: storing the clicked template and opening the edit modal.
  const openEdit = (template: Template) => {
    setEditingTemplate(template);
    setModalMode('edit');
  };

  //Show a loading message while the API call is in progress
  if (isLoading) {
    return <div className="p-8 text-gray-400">Loading templates...</div>;
  }

  //Show an error message if the API call failed
  if (fetchError) {
    return <div className="p-8 text-red-500">Error: {fetchError}</div>;
  }





  // ─── Render the page ───
  return (
    <div className="p-8">

      {/* Page header: title, subtitle with template count, and the Add New button */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#9f0059]">Message Template</h1>
          <p className="text-sm text-gray-500 mt-1">
            There {templates.length === 1 ? 'is' : 'are'} {templates.length} Message template{templates.length !== 1 ? 's' : ''} in the system
          </p>
        </div>

        {/* Clicking this button sets modalMode to "create" which renders the Create modal below */}
        <button
          onClick={() => setModalMode('create')}
          className="flex items-center gap-2 bg-[#9f0059] text-white px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          <span className="text-lg leading-none">+</span>
          Add New
        </button>
      </div>

      {/* Table container */}
      <div className="table-container p-6">

        {/* Toolbar above the table: "All Templates" heading, Delete button, Search input */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">All Templates</h2>

          <div className="flex items-center gap-3">

            {/* Delete button — only appears when at least one checkbox is also ticked */}
            {selectedIds.size > 0 && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-red-500 text-sm font-medium hover:text-red-700 transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
                Delete
              </button>
            )}

            {/* Visual separator line between Delete and Search - only shown when Delete is visible */}
            {selectedIds.size > 0 && <div className="h-5 w-px bg-gray-300" />}

            {/* Search input-filters the table in real time as the user types */}
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

        {/* The Data table */}
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fdf5ee]">
                {/* Header checkbox: ticking this selects OR deselects all visible rows AT ONCE */}
                <th className="w-12 px-4 py-3 text-left">
                  <Checkbox checked={allSelected} onChange={toggleSelectAll} />
                </th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Title</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Message</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* If no templates match the search, it shows a friendly empty state message */}
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No templates found.
                  </td>
                </tr>
              ) : (
                // Render one row per template
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">

                    {/* Row checkbox — ticking this adds the template's ID to selectedIds */}
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={selectedIds.has(template.id)}
                        onChange={() => toggleSelect(template.id)}
                      />
                    </td>

                    {/* Title column - in the API this field is called template_type */}
                    <td className="px-4 py-4 text-gray-800 font-medium w-1/3">
                      {template.template_type}
                    </td>

                    {/* Message preview - truncated to 60 characters to keep the table readable.
                        In the API this field is called "template_content" */}
                    <td className="px-4 py-4 text-gray-500">
                      {template.template_content.length > 60
                        ? template.template_content.slice(0, 60) + '...'
                        : template.template_content}
                    </td>

                    {/* EDIT Button — clicking this stores the template in editingTemplate
                        and opens the Edit modal pre-filled with its current values */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => openEdit(template)}
                        className="flex items-center gap-1.5 text-gray-600 hover:text-[#9f0059] transition-colors cursor-pointer text-sm"
                      >
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

      {/* Create modal - only rendered when modalMode is "create" */}
      {modalMode === 'create' && (
        <TemplateModal
          mode="create"
          onSave={handleCreate}
          onCancel={() => setModalMode(null)}
        />
      )}

      {/* Edit modal- only rendered when modalMode is 'edit' AND we know which template to edit.
          initialTitle and initialMessage pre-fill the form with the template's current values. */}
      {modalMode === 'edit' && editingTemplate && (
        <TemplateModal
          mode="edit"
          initialTitle={editingTemplate.template_type}
          initialMessage={editingTemplate.template_content}
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
