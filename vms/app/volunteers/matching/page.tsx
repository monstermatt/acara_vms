"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { MessageIcon } from "@/icons";
import { FilterIcon } from "@/icons";
import { Languages } from "lucide-react";

interface NestedSkill {
  skill_id: number;
  skill_name: string;
}
interface NestedLanguage {
  language_id: number;
  language_name: string;
}
interface NestedPreference {
  pref_id: number;
  preference: string;
}
interface UserData {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  gender: string;
  skills: NestedSkill[];
  languages: NestedLanguage[];
  preferences: NestedPreference[];
  max_distance_preferred: number;
  phone_number: string; 
  sub_duty_preference: boolean; 
  }
// const initialData: UserData[] = [
//   { id: 1, name: "Alice Smith", gender: "Female", skills: ["Death Doula", "Knitting"], schedule: "Monday 1000-1200", isSub: true, languages: ["English", "Spanish"], preferences: ["office", "patient"], travelDistance: 10 },
//   { id: 2, name: "Bob Johnson", gender: "Male", skills: ["IT", "Martial Arts"], schedule: "Tuesday 1400-1600", isSub: false, languages: ["English"], preferences: ["office", "patient"], travelDistance: 15 },
//   { id: 3, name: "Charlie Davis", gender: "Non-binary", skills: ["Grief Counseling", "ASL"], schedule: "Monday 1200-1800", isSub: false, languages: ["English", "ASL"], preferences: ["special events", "patient"], travelDistance: 20 },
//   { id: 4, name: "Diana Prince", gender: "Female", skills: ["Respite Care", "Canadian"], schedule: "Wednesday 1300-1700", isSub: false, languages: ["English", "French"], preferences: ["office", "patient"], travelDistance: 25 },
//   { id: 5, name: "Evan Wright", gender: "Male", skills: ["Guitar", "Vigil Team"], schedule: "Friday 0800-1200", isSub: false, languages: ["English"], preferences: ["patient", "facility"], travelDistance: 30 },
//   { id: 6, name: "Fiona Lee", gender: "Female", skills: ["Cooking", "Gardening"], schedule: "Thursday 1000-1400", isSub: true, languages: ["English", "Spanish"], preferences: ["office", "special events"], travelDistance: 5 },
//   { id: 7, name: "George Miller", gender: "Male", skills: ["Cornhole", "Competitive Eating"], schedule: "Monday 0800-1200", isSub: false, languages: ["English"], preferences: ["patient", "facility"], travelDistance: 12 },
//   { id: 8, name: "Hannah Brown", gender: "Female", skills: ["Painting", "Music"], schedule: "Tuesday 1000-1400", isSub: false, languages: ["English", "French"], preferences: ["office", "patient"], travelDistance: 8 },
// ]

/*TEMPORARY STYLES */
const trStyle = {
  border: "1px solid #DEDEDE",
  background: "#FFF",
  }

const tbodyStyle = {
  color: "#494949",
  font: "Quicksand",
  textAlign: "center" as const,
}

export default function MatchingPage() {
  /*hold fetched data*/
  const [volunteers, setVolunteers] =useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*modal state/functions */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  /*filter state/functions */
  const [filters, setFilters] = useState({
    name: "",
    gender: "",
    skill: "",
    schedule: "",
    isSub: "",
    languages: "",
    preferences: "",
    travelDistance: "",
  });

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/volunteers/");

        if (!response.ok) {
          throw new Error('Danger Will Robinson: ${response.status}');
        }

        const data = await response.json();

        console.log("Fetched data: ", data); //debugging

        setVolunteers(data);
      }
      catch (err:any) {
        console.error("Failed to fetch volunteers:", err);
        setError(err.message);
      }
      finally {
        setIsLoading(false);
      }
    };

    fetchVolunteers();
    }, []);

  const filterChange = (e:React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {name, value} = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }))
  };

  const filteredData = volunteers.filter((volunteer) => {
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

  return (
    fullName.toLowerCase().includes(filters.name.toLowerCase()) &&
    (volunteer.gender || "").toLowerCase().includes(filters.gender.toLowerCase()) &&
    matchesSkill &&
    matchesPreference &&
    matchesDistance //&&
    //(volunteer.schedule || "").toLowerCase().includes(filters.schedule.toLowerCase())
  );
});

if (isLoading) return <div className="p-8 text-center">Loading volunteers</div>;
if (error) return <div className = "p-8 text-center text-red-500">Error Loading. {error}</div>;


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
  });
};


return (
  <main className = "min-h-screen">
    <header className ="mb-8">
    <h2 className="page-header">Volunteer Matching</h2>
    <p className="text-gray-500">Ugly, but functions. Kind of.</p>
    </header>

    {/* modal button */}
    <div className="flex gap-4 mb-6">
      <button 
        onClick={toggleModal}
        className={isModalOpen ? "active-button" : "inactive-button"}
        title = {isModalOpen ? 'Hide Filters' : 'Show Filters'}
      >
        {isModalOpen ? <FilterIcon /> : (<FilterIcon />)}
      </button>
    
    <button className = "active-button" onClick={resetFilters}>
      Reset Filters
    </button>
    </div>

    {/* filter section */}
    {isModalOpen && (
      <div className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50'
        onClick = {toggleModal}>
        <div className = 'bg-white p-8 rounded-lg max-w-md relative'
          onClick={(e) => e.stopPropagation()}> {/* prevents click from propagating to backdrop and closing modal */}
          <button
            className = 'absolute top-4 right-4 text-gray-500 hover:text-black'
            onClick={toggleModal}
            >x</button>

    <section className="input-section">
          <div>
            <h2 className = 'page-header'>Add A Filter</h2>
            
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
          <option value="Female">F</option>
          <option value="Male">M</option>
          <option value="Non-binary">N</option>
        </select>

        <select
          className="input-style"
          id="preferences"
          name="preferences"
          value={filters.preferences}
          onChange={filterChange}
        >
          <option value="">All preferences</option>
          <option value="Office">Office</option>
          <option value="facility">Facility</option>
          <option value="Patient">Patient</option>
        </select>

        <input
          className="input-style"
          type="number"
          min="0"
          name="travelDistance"
          placeholder="Max travel distance"
          value={filters.travelDistance}
          onChange={filterChange}
        />

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
        <button className="active-button"
          onClick={resetFilters}>
              Reset 
        </button>
        </div>
        </section>
            </div>
          </div>
        )}
        

    <section>
    <div className = 'table-container'>
    <table className = "w-100%">
      <thead className = 'thead'>
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
          filteredData.map((volunteer) => (
            <tr key={volunteer.id} style={trStyle}>
              <td>{volunteer.user?.first_name} {volunteer.user?.last_name}</td>
              <td>{volunteer.phone_number}</td>
              <td>{volunteer.gender}</td>
              <td>
                <div>
                  {volunteer.skills?.map((skill, index) =>(
                    <span key={index}>{skill.skill_name}{index < volunteer.skills.length - 1 ? ", " : ""} </span>
                  ))}
                </div>
              </td>
              <td>Pending</td>
              <td>{volunteer.languages?.map(lang => lang.language_name).join(", ")}</td>
              <td>{volunteer.sub_duty_preference ? "Yes" : "No"}</td>
              <td>{volunteer.preferences?.map((pref, index) =>(
                <span key={index}>{pref.preference}{index < volunteer.preferences.length-1 ? ",": ""} </span>
              ))}</td>
              <td>{volunteer.max_distance_preferred} miles</td>
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
