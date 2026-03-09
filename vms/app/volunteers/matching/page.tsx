"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { MessageIcon } from "@/icons";

/*mockdata*/
interface UserData {
  id: number;
  name: string;
  gender: string;
  skills: string[];
  schedule: string;
  isSub: boolean;
  preferences: string[]
  travelDistance: number;
}
const initialData: UserData[] = [
  { id: 1, name: "Alice Smith", gender: "Female", skills: ["Death Doula", "Knitting"], schedule: "Monday 1000-1200", isSub: true, preferences: ["office", "patient"], travelDistance: 10 },
  { id: 2, name: "Bob Johnson", gender: "Male", skills: ["IT", "Martial Arts"], schedule: "Tuesday 1400-1600", isSub: false, preferences: ["office", "patient"], travelDistance: 15 },
  { id: 3, name: "Charlie Davis", gender: "Non-binary", skills: ["Grief Counseling", "ASL"], schedule: "Monday 1200-1800", isSub: false, preferences: ["special events", "patient"], travelDistance: 20 },
  { id: 4, name: "Diana Prince", gender: "Female", skills: ["Respite Care", "Canadian"], schedule: "Wednesday 1300-1700", isSub: false, preferences: ["office", "patient"], travelDistance: 25 },
  { id: 5, name: "Evan Wright", gender: "Male", skills: ["Guitar", "Vigil Team"], schedule: "Friday 0800-1200", isSub: false, preferences: ["patient", "facility"], travelDistance: 30 },
  { id: 6, name: "Fiona Lee", gender: "Female", skills: ["Cooking", "Gardening"], schedule: "Thursday 1000-1400", isSub: true, preferences: ["office", "special events"], travelDistance: 5 },
  { id: 7, name: "George Miller", gender: "Male", skills: ["Cornhole", "Competitive Eating"], schedule: "Monday 0800-1200", isSub: false, preferences: ["patient", "facility"], travelDistance: 12 },
];

/*TEMPORARY STYLES */
const trStyle = {
  border: "1px solid #DEDEDE",
  background: "#FFF",
  }
const theadFontStyle = {
  color: "#CD5000",
  font: "Quicksand",
  size: "16px",
  weight: "700",
}
const tbodyStyle = {
  color: "#494949",
  font: "Quicksand",
  textAlign: "center" as const,
}

const tableContainerStyle = {
  borderRadius: "20px",
  border: "1.5px solid #DEDEDE",
  background: "#FFF",
}
const tableStyle = {
  width: "100%",
}


export default function MatchingPage() {

  const [filters, setFilters] = useState({
    name: "",
    gender: "",
    skill: "",
    schedule: "",
    isSub: "",
    preferences: "",
    travelDistance: "",
  });

  const filterChange = (e:React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {name, value} = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }))
  };

  const filteredData = initialData.filter((user) => {
    const matchesSkill = user.skills.some((skillItem) =>
      skillItem.toLowerCase().includes(filters.skill.toLowerCase())
    );

  return (
    user.name.toLowerCase().includes(filters.name.toLowerCase()) &&
    user.gender.toLowerCase().includes(filters.gender.toLowerCase()) &&
    matchesSkill &&
    user.schedule.toLowerCase().includes(filters.schedule.toLowerCase())
  );
});

const resetFilters = () => {
  setFilters({
    name: "",
    gender: "",
    skill: "",
    schedule: "",
    isSub: "",
    preferences: "",
    travelDistance: "",
  });
};


return (
  <main className = "min-h-screen">
    <header className ="mb-8">
    <h2 className="page-header">Volunteer Matching</h2>
    <p className="text-gray-500">Ugly, but functions. Kind of.</p>
    </header>

    <section className="input-section">
      <div>
        
    <input
      className="input-style"
      type="text"
      name="name"
      placeholder="Filter by name"
      value={filters.name}
      onChange={filterChange}
      />

    <select
      className="input-style"
      id="gender"
      name="gender"
      value={filters.gender}
      onChange={filterChange}
    >
      <option value="">All genders</option>
      <option value="Female">Female</option>
      <option value="Male">Male</option>
      <option value="Non-binary">Non-binary</option>
    </select>

    <input
      className="input-style"
      type="text"
      name="skill"
      placeholder="Filter by skills"
      value={filters.skill}
      onChange={filterChange}
    />

{/* filterChange needs to be updated before isSub? checkbox can be added back in */}
    {/* Is Substitute?<input
      className="input-style"
      type="checkbox"
      name="isSub"
      checked={filters.isSub === "true"}
      onChange={filterChange}
      /> */}

    
      </div>
    

    <div>
    <button className="reset-button"
      onClick={resetFilters}>
          Reset 
    </button>
    </div>
    </section>

    <section>
    <div style = {tableContainerStyle}>
    <table style= {tableStyle}>
      <thead style={theadFontStyle}>
        <tr>
          <th>Name</th>
          <th>Phone Number</th>
          <th>Gender</th>
          <th>Skills</th>
          <th>Schedule</th>
          <th>Languages</th>
          <th>Sub?</th>
          <th>Preferences</th>
          <th>Travel Distance</th>
          <th>Actions</th>
        </tr>

        <tr>
        </tr>
      </thead>
      <tbody style={tbodyStyle}>
        {filteredData.length > 0 ? (
          filteredData.map((user) => (
            <tr key={user.name} style={trStyle}>
              <td>{user.name}</td>
              <td>PhoneNumber</td>
              <td>{user.gender}</td>
              <td>
                <div>
                  {user.skills.map((skill, index) =>(
                    <span key={index}>{skill}, </span>
                  ))}
                </div>
              </td>
              <td>{user.schedule}</td>
              <td>Languages</td>
              <td>{user.isSub ? "Yes" : "No"}</td>
              <td>{user.preferences.map((preference, index) =>(
                <span key={index}>{preference}, </span>
              ))}</td>
              <td>{user.travelDistance} miles</td>
              <td>
                <div className = "flex items-center justify-center gap-2">
                  <MessageIcon/>
                  <span>Message</span>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6}>
              No volunteers found matching the criteria.
            </td>
          </tr>
        )}
      </tbody>
    </table>
    </div>
    </section>
  </main>
)
};
