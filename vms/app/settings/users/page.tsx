'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from "next-auth/react";


// HOW a user looks like
interface User {
  id: number;
  username?: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active?: boolean;
  role: 'VOLUN' | 'COORD' | 'ADMIN'; 
  avatar?: string;
}

// There are 3 possible roles - coorindaro, volunteer and admin. 
const ROLES = ['VOLUN', 'COORD', 'ADMIN'] as const; // roles must match the backend
const ROLE_LABELS: Record<string, string> = { //define the labels for the roles to show in the UI, instead of the raw values from the backend
  VOLUN: "Volunteer",
  COORD: "Coordinator",
  ADMIN: "Admin",
};


//This is only dummy data for now, replace with real API call  will come later
// const DUMMY_USERS: User[] = [
//   { id: 1, first_name: 'Name', last_name: 'Surname', email: 'email@domain.com', role: 'COORD' },
// ];

// The pencil icon — same as in messages page
function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// The trash icon — same as in messages page
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}



// checkbox — this is copied exactly from messages page
function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
        checked ? 'bg-[#cd5000] border-[#cd5000]' : 'border-gray-400 bg-white'
      }`}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}





// Dropdown to select a role, used in create and also in edit

function RoleDropdown({ value, onChange }: { value: string; onChange: (r: string) => void }) {
  const [open, setOpen] = useState(false);



  return (
    <div className="flex-1 relative">
      <label className="block text-sm font-semibold text-gray-800 mb-1">Role</label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#9f0059] bg-white cursor-pointer"
      >
        <span className={value ? 'text-gray-700' : 'text-gray-400'}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Select a role'}
        </span>
        {/* arrow flips when open */}
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>



      {/* the 3 options */}
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { onChange(r); setOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              {ROLE_LABELS[r]} {/*display row with the label, not the value*/}
            </button>
          ))}
        </div>
      )}
    </div>
  );


}



// Avatar with Upload, used in create and edit
function AvatarPicker({ preview, onChange }: { preview: string | null; onChange: (url: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onChange(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          // grey person icon when no image is selected
          <svg width="50" height="50" viewBox="0 0 24 24" fill="#9ca3af">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        )}
      </div>
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFile} className="hidden" />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#9f0059] cursor-pointer"
      >
        <EditIcon />
        Edit
      </button>
    </div>
  );
}




// A back arrow button
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}

// THIS IS THE MAIN page, decides which view to show
export default function UsersPage() { 
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [users, setUsers] = useState<User[]>([]); // this will hold the users data, initially empty until we fetch from the API;
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: session } = useSession(); // set variable for the session to get the token for authentication when hitting the API
  const token = (session as any)?.accessToken; //extract token from nextauth session

  //add loading erors
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  //fetch users from the API when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return; // if no token, don't attempt to fetch

      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // pass the token in the header for authentication
          }
        });
        if (!response.ok) throw new Error(`Failed to fetch users. (Status: ${response.status})`);
        const data = await response.json();

      if (Array.isArray(data)) { // if the API returns a plain array of users
          setUsers(data);
        } else if (data && data.results) {
          setUsers(data.results);
        } else {
          setUsers([]);
        }

      } catch (err: any) {
        console.error(err);
        setFetchError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [token]); // dependency on token means it will re-run if the session changes and we get a new token


  // filter table based on the search input
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });



  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setView('edit');
  };


  const handleUserCreated = (newUser: User) => {
    setUsers((prev) => [...prev, { ...newUser, id: prev.length + 1 }]);
    setView('list');
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setView('list');
  };


  const handleUserDeleted = async (userId: number) => {
    if (!token) return; // if no token, don't attempt to delete
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${userId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error(`Failed to delete user. (Status: ${response.status})`);

      // Update local state only after successful backend deletion
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setView('list');
      
    } catch (err: any) {
      console.error(err);
      // UI error state
      alert("There was an error deleting the user: " + err.message);
    }
  };

  const handleMultipleUsersDeleted = async (ids: number[]) => {
    if (!token) return;

    try {
      // Create an array for each selected user ID
      const deletePromises = ids.map(id =>
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${id}/`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }).then(res => {
          if (!res.ok) throw new Error(`Failed to delete user ${id}`);
          return id;
        })
      );

      // Wait for all delete requests to finish
      await Promise.all(deletePromises);

      // Update local state after all backend deletions succeed
      setUsers((prev) => prev.filter((u) => !ids.includes(u.id)));
      
    } catch (err: any) {
      console.error(err);
      alert("There was an error deleting some users. Please refresh the page to see the current state.");
    }
  };

  return (
    <div className="p-8 w-full">
      {view === 'list' && (
        <UsersListView
          users={filteredUsers}
          totalCount={users.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddNew={() => setView('create')}
          onEdit={handleEditClick}
          // Replace the inline function with your new async function
          onDeleteMultiple={handleMultipleUsersDeleted} 
        />
      )}
      {view === 'create' && (
        <CreateUserView onBack={() => setView('list')} onSave={handleUserCreated} />
      )}
      {view === 'edit' && selectedUser && (
        <EditUserView
          user={selectedUser}
          onBack={() => setView('list')}
          onSave={handleUserUpdated}
          onDelete={handleUserDeleted}
        />
      )}
    </div>
  );
}

// View 1 - the users table
function UsersListView({
  users, totalCount, searchQuery, onSearchChange, onAddNew, onEdit, onDeleteMultiple,
}: {
  users: User[];
  totalCount: number;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onAddNew: () => void;
  onEdit: (user: User) => void;
  onDeleteMultiple: (ids: number[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());


  // toggle a single row
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };


  // selecting   all or deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  };

  const allSelected = users.length > 0 && selectedIds.size === users.length;

  // ask before deleting- Are you sure??
  const handleDelete = () => {
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.size} user(s)?`);
    if (confirmed) {
      onDeleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#9f0059]">Users</h1>
          <p className="text-sm text-gray-500 mt-1">There are {totalCount} users in the system</p>
        </div>
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 bg-[#9f0059] text-white px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          + Add New
        </button>
      </div>



      {/* table container — same class as messages page */}
      <div className="table-container p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">All users</h2>

          <div className="flex items-center gap-3">
            {/* delete button — only visible when at least one row is checked */}
            {selectedIds.size > 0 && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-red-500 text-sm font-medium hover:text-red-700 transition-colors cursor-pointer"
              >
                <TrashIcon />
                Delete
              </button>
            )}




            {/* divider between delete and search */}
            {selectedIds.size > 0 && <div className="h-5 w-px bg-gray-300" />}

            {/* search input */}
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
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 pr-4 py-2 border border-gray-300 rounded-full text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9f0059] w-48"
              />
            </div>
          </div>

        </div>

        {/* table — same structure as messages page */}
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fdf5ee]">
                <th className="w-12 px-4 py-3 text-left">
                  <Checkbox checked={allSelected} onChange={toggleSelectAll} />
                </th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Surname</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Role</th>
                <th className="px-4 py-3 text-left text-[#cd5000] font-semibold">Actions</th>
              </tr>

            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <Checkbox checked={selectedIds.has(user.id)} onChange={() => toggleSelect(user.id)} />
                    </td>
                    <td className="px-4 py-4 text-gray-500">{user.first_name}</td>
                    <td className="px-4 py-4 text-gray-500">{user.last_name}</td>
                    <td className="px-4 py-4 text-gray-500">{user.email}</td>
                    <td className="px-4 py-4 text-gray-500">
                      {ROLE_LABELS[user.role] || user.role} {/*display the label, not the raw value*/}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => onEdit(user)}
                        className="flex items-center gap-1.5 text-gray-600 hover:text-[#9f0059] transition-colors cursor-pointer text-sm"
                      >
                        <EditIcon />
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
    </div>
  );
}

// VIEW 2 - for creating a new user
function CreateUserView({ onBack, onSave }: { onBack: () => void; onSave: (u: User) => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  // checking that all required fields are filled
  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!firstName.trim()) e.firstName = 'Name is required';
    if (!lastName.trim()) e.lastName = 'Surname is required';
    if (!email.trim()) e.email = 'Email is required';
    if (!role) e.role = 'Please select a role';
    return e;
  };


const { data: session } = useSession(); // set variable for the session to get the token for authentication when hitting the API

const handleSave = async () => {
  const token = (session as any)?.accessToken; //extract token from nextauth session
  
  const errs = validate();
  if (Object.keys(errs).length > 0) { setErrors(errs); return; }
  
  // Create the Base User (Runs for everyone: admins, coordinators, volunteers)
  try {
    const userPayload = {
      username: email,
      email: email,
      first_name: firstName,
      last_name: lastName,
      role: role // 'admin', 'coordinator', or 'volunteer'
    };

    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users/`, {
      method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` // pass the token in the header for authentication
        },
        body: JSON.stringify(userPayload),
    });

    if (!userResponse.ok) throw new Error("Failed to create base user.");
    const createdUser = await userResponse.json();

    if (role === 'VOLUN') {
      const volunteerPayload ={
        user_id: createdUser.id,
        phone_number: "555-555-5555",
        address: "TBD",
        };
        
        try {
          const volResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/volunteers/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(volunteerPayload),
          });

          if (!volResponse.ok) {
          console.warn("Base user created, but Volunteer profile failed:", await volResponse.text());
          } else {
            console.log("Volunteer profile successfully linked to user.");
          }
        } catch (volErr) {
          console.error("Network error while creating Volunteer profile:", volErr);
        }
      }

    try{
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/forgot-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email: createdUser.email}), // send the email to trigger the password setup flow
        });
        if (!emailResponse.ok) {
          console.warn( "User created but email endpoint returned an error:", await emailResponse.text());
        } else {
          console.log("Password setup email triggered successfully for", createdUser.email);
        }
      }catch (emailErr) {
        console.error("Network error while triggering password setup email:", emailErr);
      }

    onSave({
      id: createdUser.id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      role: role as User['role'],
      // avatar logic...
    });

  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    alert("There was an error creating the user: " + message);
  }
};
  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <BackButton onClick={onBack} />
        <div>
          <h1 className="page-header mb-0">Create user</h1>
          <p className="text-gray-500 text-sm">Fill in the form to create a new user</p>
        </div>
      </div>

      <div className="flex gap-10 mt-8">
        <AvatarPicker preview={avatar} onChange={setAvatar} />

        <div className="flex-1 max-w-2xl">
          {/* name + surname row */}
          <div className="flex gap-6 mb-5">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-1">Name</label>
              <input
                type="text" placeholder="Name*" value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9f0059]"
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-1">Surname</label>
              <input
                type="text" placeholder="Surname*" value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9f0059]"
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>



          {/* email + role row */}
          <div className="flex gap-6 mb-8">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
              <input
                type="email" placeholder="Email*" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9f0059]"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="flex-1">
              <RoleDropdown value={role} onChange={setRole} />
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="bg-[#9f0059] text-white px-10 py-3 rounded-full font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}





// VIEW 3 - editing  an existing user
function EditUserView({
  user, onBack, onSave, onDelete,
}: {
  user: User;
  onBack: () => void;
  onSave: (u: User) => void;
  onDelete: (id: number) => void;
}) {
  // prefill the fields with the user's current data
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [avatar, setAvatar] = useState<string | null>(user.avatar || null);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

const {data: session } = useSession(); // set variable for the session to get the token for authentication when hitting the API


  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!firstName.trim()) e.firstName = 'Name is required';
    if (!lastName.trim()) e.lastName = 'Surname is required';
    if (!email.trim()) e.email = 'Email is required';
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const token = (session as any)?.accessToken; //extract token from nextauth session

    const updatePayload = {
      username: email,
      email: email,
      first_name: firstName,
      last_name: lastName,
      role: role,
    };

    try{
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${user.id}/`, {
        method: "PATCH", // use PATCH for partial update
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) throw new Error(`Failed to update user. (Status: ${response.status})`);

      const updatedUser = await response.json()

      // Only fire this if they are set to Volunteer AND weren't a Volunteer before
      if (role === 'VOLUN' && user.role !== 'VOLUN') {
        const volunteerPayload = {
          user_id: user.id, 
          phone_number: "555-555-5555", // Placeholders for required fields
          address: "TBD",
        };

        try {
          const volResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/volunteers/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(volunteerPayload),
          });

          if (!volResponse.ok) {
            console.warn("User updated, but Volunteer profile creation failed:", await volResponse.text());
          } else {
            console.log("New Volunteer profile successfully linked to the updated user.");
          }
        } catch (volErr) {
          console.error("Network error while creating Volunteer profile:", volErr);
        }
      }

      onSave({
        ...user,
        ...updatedUser, // use the response from the backend to update the UI
        avatar: avatar || undefined // handle avatar separately if needed
      });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      alert("There was an error updating the user: " + message);
    }
  };

  // asking before deleting
  const handleDelete = () => {
    const confirmed = window.confirm(`Are you sure you want to delete ${firstName} ${lastName}?`);
    if (confirmed) onDelete(user.id);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <BackButton onClick={onBack} />
        <div>
          <h1 className="page-header mb-0">Edit User</h1>
          <p className="text-gray-500 text-sm">Fill in the form to edit a new user</p>
        </div>
      </div>

      <div className="flex gap-10 mt-8">
        <AvatarPicker preview={avatar} onChange={setAvatar} />

        <div className="flex-1 max-w-2xl">
          {/* name + surname row */}
          <div className="flex gap-6 mb-5">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-1">Name</label>
              <input
                type="text" value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9f0059]"
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-1">Surname</label>
              <input
                type="text" value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9f0059]"
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* email + role row */}
          <div className="flex gap-6 mb-8">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9f0059]"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <RoleDropdown value={role} onChange={(r) => setRole(r as User['role'])} />
          </div>


          {/* delete left, save right */}
          <div className="flex justify-end items-center gap-4">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
            >
              <TrashIcon />
              Delete
            </button>
            <button
              onClick={handleSave}
              className="bg-[#9f0059] text-white px-10 py-3 rounded-full font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
