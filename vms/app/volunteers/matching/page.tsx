"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/*mockdata*/
interface UserData {
  id: number;
  name: string;
  gender: string;
  skills: string[];
  schedule: string;
}
const initialData: UserData[] = [
  { id: 1, name: "Alice Smith", gender: "Female", skills: ["Death Doula", "Knitting"], schedule: "Monday 1000-1200" },
  { id: 2, name: "Bob Johnson", gender: "Male", skills: ["IT", "Martial Arts"], schedule: "Tuesday 1400-1600" },
  { id: 3, name: "Charlie Davis", gender: "Non-binary", skills: ["Grief Counseling", "ASL"], schedule: "Monday 1200-1800" },
  { id: 4, name: "Diana Prince", gender: "Female", skills: ["Respite Care", "Canadian"], schedule: "Wednesday 1300-1700" },
  { id: 5, name: "Evan Wright", gender: "Male", skills: ["Guitar", "Vigil Team"], schedule: "Friday 0800-1200" },
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
}
const inputStyle = {
  borderRadius: "63px",
  border: "1.5px solid #DEDEDE",
  background: "#FFF",
  color: "#494949",
}

export default function MatchingPage() {

  const [filters, setFilters] = useState({
    name: "",
    gender: "",
    skill: "",
    schedule: "",
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

return (
  <div>
    <h2 className="text-2xl font-bold text-[#9f0059] mb-4">Volunteer Matching</h2>
    <h3 className="text-2xl font-bold text-[#9f0059] mb-4">Ugly, but functions. Kind of.</h3>
    <input
      style={inputStyle}
      type="text"
      name="name"
      placeholder="Filter by name"
      value={filters.name}
      onChange={filterChange}
      />
      <br />
    <input
      style={inputStyle}
      type="text"
      name="skill"
      placeholder="Filter by skills"
      value={filters.skill}
      onChange={filterChange}
    />

    <table>
      <thead style={theadFontStyle}>
        <tr>
          <th>Name</th>
          <th>Gender</th>
          <th>Skills</th>
          <th>Schedule</th>
        </tr>

        <tr>
        </tr>
      </thead>
      <tbody style={tbodyStyle}>
        {filteredData.length > 0 ? (
          filteredData.map((user) => (
            <tr key={user.name} style={trStyle}>
              <td>{user.name}</td>
              <td>{user.gender}</td>
              <td>
                <div>
                  {user.skills.map((skill, index) =>(
                    <span key={index}>{skill}, </span>
                  ))}
                </div>
              </td>
              <td>{user.schedule}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4}>
              No volunteers found matching the criteria.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)
};
