"use client";

import { useState } from "react";
import { UserData } from "../types/volunteer";
import VolunteerTable from "./VolunteerTable"; 
import CreateVolunteerModal from "./AddUser";

interface ManageDashboardProps {
  initialVolunteers: UserData[];
}

export default function ManageDashboard({ initialVolunteers }: ManageDashboardProps) {
  const [volunteers, setVolunteers] = useState<UserData[]>(initialVolunteers);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const handleUserCreated = (newUser: UserData) => {
    // Add the new user to the table list
    setVolunteers((prev: UserData[]) => [newUser, ...prev]);
  };

  return (
    <>
      <div className="flex gap-4 mb-6">
        <button 
          onClick={toggleModal}
          className="bg-[#9F0059] p-2 m-1 rounded-full border text-white mb-4"
        >
          + Create Volunteer
        </button>
      </div>

      {isModalOpen && (
        <CreateVolunteerModal 
          onClose={toggleModal} 
          onSuccess={handleUserCreated} 
        />
      )}

      <section className="bg-white rounded shadow-sm overflow-hidden">
        <VolunteerTable data={volunteers} />
      </section>
    </>
  );
}