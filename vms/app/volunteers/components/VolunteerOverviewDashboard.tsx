"use client";

import { useState } from "react";
import { UserData } from "../types/volunteer";
import VolunteerTable from "./VolunteerTable";
import CreateUserModal from "./AddUser";

interface ManageDashboardProps {
  initialVolunteers: UserData[];
}

export default function ManageDashboard({ initialVolunteers }: ManageDashboardProps) {
  // We store the volunteers in state here so we can update the table
  // locally when a new user is added, preventing the need for a full page reload.
  const [volunteers, setVolunteers] = useState<UserData[]>(initialVolunteers);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const handleUserCreated = (newUser: UserData) => {
    // Add the new user to the top of the table list
    setVolunteers((prev) => [newUser, ...prev]);
  };

  return (
    <>
      <div className="flex gap-4 mb-6">
        <button 
          onClick={toggleModal}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          + Create Volunteer
        </button>
      </div>

      {isModalOpen && (
        <CreateUserModal 
          onClose={toggleModal} 
          onSuccess={handleUserCreated} 
        />
      )}

      {/* Reusing your table exactly as it is! */}
      <section>
        <VolunteerTable data={volunteers} />
      </section>
    </>
  );
}