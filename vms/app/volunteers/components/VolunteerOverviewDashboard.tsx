"use client";

import { useState } from "react";
import { UserData } from "../types/volunteer";
import VolunteerTable from "./VolunteerTable"; 
import CreateVolunteerModal from "./AddUser";
import EditVolunteerModal from "./EditVolunteerModal";

interface ManageDashboardProps {
  initialVolunteers: UserData[];
}

export default function ManageDashboard({ initialVolunteers }: ManageDashboardProps) {
  const [volunteers, setVolunteers] = useState<UserData[]>(initialVolunteers);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVolunteerId, setEditingVolunteerId] = useState<number | null>(null);
  const toggleCreateModal = () => setIsCreateModalOpen(!isCreateModalOpen);

  const handleUserCreated = (newUser: UserData) => {
    // Add the new user to the table list
    setVolunteers((prev: UserData[]) => [newUser, ...prev]);
  };

  const handleUsersDeleted = (deletedIds: number[]) => {
    setVolunteers((prev) => prev.filter((vol) => !deletedIds.includes(vol.id)));
  };
  const handleEditRequest = (id:number) => {
    setEditingVolunteerId(id);
    // setIsEditModalOpen(true); // This will open the edit modal
  };
  const handleUserUpdated = (updatedUser: UserData) => {
    setVolunteers((prev) =>
    prev.map((vol) => (vol.id === updatedUser.id ? updatedUser: vol))
    );
  setEditingVolunteerId(null);
  };
  
  return (
    <>
      <div className="flex gap-4 mb-6">
        <button 
          onClick={toggleCreateModal}
          className="bg-[#9F0059] p-2 m-1 rounded-full border text-white mb-4"
        >
          + Create Volunteer
        </button>
      </div>

      {isCreateModalOpen && (
        <CreateVolunteerModal 
          onClose={toggleCreateModal} 
          onSuccess={handleUserCreated} 
        />
      )}

      {/*Implement EditVolunteerModal based on AddUser */}
      {editingVolunteerId && (
        <EditVolunteerModal
          volunteerId={editingVolunteerId}
          onClose={() => setEditingVolunteerId(null)}
          onSuccess={handleUserUpdated}
        />
      )}

      <section className="bg-white rounded shadow-sm overflow-hidden">
        {/* Pass the new callbacks to the table */}
        <VolunteerTable 
          data={volunteers} 
          onDelete={handleUsersDeleted}
          onEdit={handleEditRequest}
        />
      </section>
    </>
  );
}