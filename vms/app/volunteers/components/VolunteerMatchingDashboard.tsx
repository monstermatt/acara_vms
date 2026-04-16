"use client";

import { useState } from "react";
import { UserData } from "@/app/volunteers/types/volunteer";
import { FilterIcon } from "@/icons";
import VolunteerTable from "./VolunteerTable";
import FilterModal from "./FilterModal";

interface MatchingDashboardProps {
  initialVolunteers: UserData[];
}

export default function MatchingDashboard({ initialVolunteers }: MatchingDashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const [filters, setFilters] = useState({
    name: "",
    gender: "",
    skill: "",
    schedule: "",
    isSub: "",
    languages: "",
    preferences: "",
    travelDistance: "",
    team: "",
  });

  const filterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      name: "",
      gender: "",
      skill: "",
      schedule: "",
      isSub: "",
      languages: "",
      preferences: "",
      travelDistance: "",
      team: "",
    });
  };

  const filteredData = initialVolunteers.filter((volunteer) => {
    const volSkills = volunteer.skills || [];
    const volPreference = volunteer.preferences || [];
    const fullName = `${volunteer.user.first_name || ""} ${volunteer.user?.last_name || ""}`;

    const matchesSkill = filters.skill === "" || volSkills.some((skillItem) =>
      skillItem.skill_name.toLowerCase().includes(filters.skill.toLowerCase())
    );
    const matchesPreference = filters.preferences === "" || volPreference.some((preferenceItem) =>
      preferenceItem.preference.toLowerCase().includes(filters.preferences.toLowerCase())
    );
    const matchesDistance = 
      filters.travelDistance === "" ||
      volunteer.max_distance_preferred >= parseInt(filters.travelDistance);

    const matchesTeam = filters.team === "" || volunteer.team === filters.team;

    return (
      fullName.toLowerCase().includes(filters.name.toLowerCase()) &&
      (volunteer.gender || "").toLowerCase().includes(filters.gender.toLowerCase()) &&
      matchesSkill &&
      matchesPreference &&
      matchesDistance &&
      matchesTeam
    );
  });

  return (
    <>
      <div className="flex gap-4 mb-6">
        <button 
          onClick={toggleModal}
          className={isModalOpen ? "active-button" : "inactive-button"}
          title={isModalOpen ? 'Hide Filters' : 'Show Filters'}
        >
          <FilterIcon />
        </button>
        <button className="active-button" onClick={resetFilters}>
          Reset Filters
        </button>
      </div>

      {isModalOpen && (
        <FilterModal 
          filters={filters} 
          onFilterChange={filterChange} 
          onClose={toggleModal}
          onReset={resetFilters}
        />
      )}

      <section>
        <VolunteerTable data={filteredData}
        onDelete={(userId) => {
            // Implement delete logic, e.g., remove from state or API call
            console.log('Deleting user:', userId);
          }}
          onEdit={(user) => {
            // Implement edit logic, e.g., open edit modal or navigate
            console.log('Editing user:', user);
          }}
          />
      </section>
    </>
  );
}