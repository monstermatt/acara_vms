"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { UserData } from "@/app/volunteers/types/volunteer";
import WeeklyScheduleBuilder, { TimeSlot } from "./WeeklyScheduleBuilder"; 
import { EditIcon, UserIcon } from "@/icons";

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: (newUser: UserData) => void; 
}

export default function CreateVolunteerModal({ onClose, onSuccess }: CreateUserModalProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<TimeSlot[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [newLanguageInput, setNewLanguageInput] = useState("");
  const [subDutyPreference, setSubDutyPreference] = useState(false);
  // State for Preferences Dropdown
  const [isPreferenceDropdownOpen, setIsPreferenceDropdownOpen] = useState(false);
  const [selectedPreferenceIds, setSelectedPreferenceIds] = useState<number[]>([]);
  const PREFERENCE_OPTIONS = [
  { id: 1, label: "Office" },
  { id: 2, label: "Patient" },
  { id: 3, label: "Facility" },
];

  // Toggle function for checkboxes
  const handlePreferenceToggle = (id: number) => {
    setSelectedPreferenceIds((prev) =>
      prev.includes(id) 
        ? prev.filter((prevId) => prevId !== id) // Remove if already checked
        : [...prev, id] // Add if not checked
    );
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent the main form from submitting
      if (newSkillInput.trim() && !selectedSkills.includes(newSkillInput.trim())) {
        setSelectedSkills([...selectedSkills, newSkillInput.trim()]);
        setNewSkillInput("");
        setIsAddingSkill(false);
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  const handleAddLanguage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent the main form from submitting
      if (newLanguageInput.trim() && !selectedLanguages.includes(newLanguageInput.trim())) {
        setSelectedLanguages([...selectedLanguages, newLanguageInput.trim()]);
        setNewLanguageInput("");
        setIsAddingLanguage(false);
      }
    }
  };

  const removeLanguage = (languageToRemove: string) => {
    setSelectedLanguages(selectedLanguages.filter(language => language !== languageToRemove));
  };

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    gender: "",
    max_distance_preferred: 0,
    address: "",
    age_group: "",
    team: "",
    assignement_preference: "",
    availability_dayofweek: "",
    availability_starttime:"",
    availability_endtime:"",
    sub_duty_preference: false,
    native_language: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const token = (session as any)?.accessToken;
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    try {
      //Create the User, necessary to attach the other fields to
      const userPayload = {
        username: formData.email,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: "VOLUN" 
      };

      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(userPayload),
      });

      if (!userResponse.ok) {
        const errData = await userResponse.json().catch(() => null);
        console.error("User Creation Failed:", errData);
        throw new Error(errData?.email?.[0] || errData?.username?.[0] || "Failed to create User account.");
      }
      const createdUser = await userResponse.json();

      try{
      const emailResponse = await fetch('/api/forgot-password', {
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

      //Create Skills and get their IDs
      // Django's .set() requires primary keys, so we must turn our string array into an ID array
      let createdSkillIds: number[] = [];
      
      if (selectedSkills.length > 0) {
        const skillPromises = selectedSkills.map(async (skillName) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/skills/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ skill_name: skillName }),
          });
          if (res.ok) {
            const data = await res.json();
            return data.id; // Return the new primary key
          }
          return null;
        });

        // Wait for all skills to be created and filter out any failures
        const resolvedSkills = await Promise.all(skillPromises);
        createdSkillIds = resolvedSkills.filter(id => id !== null);
      }

      //create languages and get their IDs
      const selectedLangugeIds: number[] = []; 
      let createdLanguageIds: number[] = [];
      
      if (selectedLanguages.length > 0) {
        const languagePromises = selectedLanguages.map(async (languageName) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/languages/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ language_name: languageName }),
          });
          if (res.ok) {
            const data = await res.json();
            return data.id; // Return the new primary key
          }
          return null;
        });

        // Wait for all languages to be created and filter out any failures
        const resolvedLanguages = await Promise.all(languagePromises);
        createdLanguageIds = resolvedLanguages.filter(id => id !== null);
      }

      // Create the Volunteer profile
      const volunteerPayload = {
        user_id: createdUser.id || createdUser.pk, 
        phone_number: formData.phone_number,
        address: formData.address,
        age_group: formData.age_group,
        gender: formData.gender,
        max_distance_preferred: Number(formData.max_distance_preferred),
        team: formData.team,
        sub_duty_preference: formData.sub_duty_preference,
        skills: createdSkillIds, 
        languages: createdLanguageIds, 
        preferences: selectedPreferenceIds, // Make sure these IDs exist in Postgres
      };

      const volResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/volunteers/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(volunteerPayload),
      });

      if (!volResponse.ok) throw new Error("Failed to create Volunteer profile.");
      const createdVolunteer = await volResponse.json();
      const volunteerId = createdVolunteer.id || createdVolunteer.pk;

      // Create Availability
      if (availabilities.length > 0) {
        await Promise.all(availabilities.map(async (slot) => {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/availability/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({
              volunteer: volunteerId,
              dayofweek: slot.dayofweek,
              start_time: slot.start_time,
              end_time: slot.end_time,
            }),
          });
        }));
      }

      //Update Table Optimistically 
      const completeUserData: UserData = {
        id: volunteerId,
        user: {
          id: createdUser.id || createdUser.pk,
          username: createdUser.username,
          email: createdUser.email,
          first_name: createdUser.first_name,
          last_name: createdUser.last_name,
        },
        gender: createdVolunteer.gender || formData.gender,
        phone_number: createdVolunteer.phone_number || formData.phone_number,
        max_distance_preferred: createdVolunteer.max_distance_preferred || formData.max_distance_preferred,
        sub_duty_preference: createdVolunteer.sub_duty_preference || false,
        team: createdVolunteer.team || formData.team,
        // Map the strings back into the nested object format the table expects
        skills: selectedSkills.map((name, idx) => ({ skill_id: createdSkillIds[idx] || idx, skill_name: name })),
        languages: selectedLanguages.map((name, idx) => ({ language_id: createdLanguageIds[idx] || idx, language_name: name })),
        preferences: selectedPreferenceIds.map(id => {
          const matchingOption = PREFERENCE_OPTIONS.find(opt => opt.id === id);
          return {
            pref_id: id,
            preference: matchingOption ? matchingOption.label : "Unknown"
          };
        }),
        availability: availabilities as any,
        address: createdVolunteer.address || formData.address,
        age_group: createdVolunteer.age_group || formData.age_group
      };

      onSuccess(completeUserData);
      onClose(); 

    } catch (err: any) {
      console.error("Failed to create volunteer workflow:", err);
      setError(err.message || "Failed to create volunteer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto bg-background-alt p-4 md: p-8'>
      
      {/* Main Content Container */}
      <div className='main-container'>
        
        {/* Error message */}
        {error && <div className="mb-8 p-4 bg-red-100 text-red-700 text-sm font-semibold rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          
          {/* Header Section with Title & Main Buttons */}
          <div className="sticky top-0 z-20 bg-background-alt py-4 -mt-4 mb-6 flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
            <div>
              <h1 className="page-header">New Volunteer</h1>
              <p className="text-gray-500 mt-1">Fill in the form to create a new user</p>
            </div>
            <div className="flex gap-4 mt-2">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-save" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          {/* GENERAL INFO */}
          <section className="info-card">
            <h2 className="section-header">General Info</h2>
            <p className="text-gray-500 mb-10">
              Please note that your information will be kept confidential and used solely for volunteer management purposes.
            </p>

            {/* Flex layout for avatar & form grid  */}
            <div className="flex flex-col md:flex-row gap-10 items-start">
              
              {/* Profile Avatar Section */}
              <div className="flex flex-col items-center flex-shrink-0 w-40">
                <div className="w-40 h-40 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 mb-4 border border-gray-300">
                  <UserIcon size={64} className="text-gray-500" strokeWidth={1} />
                </div>
                <button type="button" className="flex items-center gap-2 text-gray-600 hover:text-primary font-medium text-sm">
                  <EditIcon size={16} /> Edit
                </button>
              </div>

              {/* General Info Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-full">
                {/* Name */}
                <div className="flex flex-col gap-1">
                  <label className="form-label" htmlFor="first_name">Name</label>
                  <input required className="input-style" type="text" name="first_name" placeholder="Name*" value={formData.first_name} onChange={handleChange} />
                </div>
                {/* Surname */}
                <div className="flex flex-col gap-1">
                  <label className="form-label" htmlFor="last_name">Surname</label>
                  <input required className="input-style" type="text" name="last_name" placeholder="Surname*" value={formData.last_name} onChange={handleChange} />
                </div>
                {/* Email Address */}
                <div className="flex flex-col gap-1 col-span-full">
                  <label className="form-label" htmlFor="email">Email address</label>
                  <input required className="input-style" type="email" name="email" placeholder="Email Address*" value={formData.email} onChange={handleChange} />
                </div>
                {/* Phone Number */}
                <div className="flex flex-col gap-1 col-span-full">
                  <label className="form-label" htmlFor="phone_number">Phone Number</label>
                  <input required className="input-style" type="text" name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} />
                </div>
                {/* Gender */}
                <div className="flex flex-col gap-1">
                  <label className="form-label" htmlFor="gender">Gender</label>
                  <select className="input-style" name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="">Select Gender</option>
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                    <option value="O">Non-binary</option>
                  </select>
                </div>
                {/* Age range */}
                <div className="flex flex-col gap-1">
                  <label className="form-label" htmlFor="age_group">Age range</label>
                  <select className="input-style" name="age_group" value={formData.age_group} onChange={handleChange}>
                    <option value="">Select Age Group</option>
                    <option value="AGEGROUP1">18-25</option>
                    <option value="AGEGROUP2">26-50</option>
                    <option value="AGEGROUP3">51+</option>
                  </select>
                </div>
                {/* Native Language !!!removed for now, can be added back!!! */}
                {/*<div className="flex flex-col gap-1">
                  <label className="form-label" htmlFor="native_language">Native Language</label>
                  <input required className="input-style" type="text" name="native_language" placeholder="Native Language*" value={formData.native_language} onChange={handleChange} />
                </div> */}
                {/* Team */}
                <div className="flex flex-col gap-1">
                  <label className="form-label" htmlFor="team">Team</label>
                  <select className='input-style' name="team" value={formData.team} onChange={handleChange}>
                    <option value ="">Select Team</option>
                    <option value = "A">Team A</option>
                    <option value = "B">Team B</option>
                    <option value = "C">Team C</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/*ADDITIONAL INFORMATION */}
          <section className="info-card">
            <h2 className="section-header">Additional Information</h2>
            <p className="text-gray-500 mb-10">
              Please provide any additional information that may help us in assigning you to suitable volunteer opportunities, such as your availability, skills, languages spoken, and any preferences you may have for the types of assignments you're interested in.
            </p>
            
            {/* Availabilities Grid Section  */}
            <div className="bg-[#f4f4f4] rounded-2xl p-6 mb-8 col-span-full">
              <WeeklyScheduleBuilder
              initialData = {availabilities}
              onScheduleChange={setAvailabilities} />
            </div>
            <div className="grid grid-cols-1 gap-6 pt-6 border-t border-gray-100">
                {/* Skills */}
                <div className="mt-4 mb-2 col-span-full">
                    {/*  Skills Grid  */}
                    <div className="mt-4 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Special Skills</h3>
                        <p className="text-sm text-gray-400 mb-3">
                        Remember that skills can include anything you have experience with that might be relevant to a patient, facility, or the office.
                        </p>
                        
                        <div className="bg-[#f4f4f4] rounded-xl p-6 min-h-[120px] flex flex-wrap content-start gap-3">              
                        {/* Render the selected skills as chips */}
                        {selectedSkills.map((skill, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-md px-3 py-1.5 flex items-center gap-2 text-sm text-gray-700 shadow-sm h-fit">
                            {skill}
                            <button 
                                type="button" 
                                onClick={() => removeSkill(skill)} 
                                className="text-gray-400 hover:text-red-500 font-bold"
                            >
                                ×
                            </button>
                            </div>
                        ))}

                        {/* The + Add New Skill Button / Input */}
                        {!isAddingSkill ? (
                            <button
                            type="button"
                            onClick={() => setIsAddingSkill(true)}
                            className="bg-white border border-gray-200 shadow-sm rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors h-fit"
                            >
                            <span className="text-gray-400 text-lg leading-none font-light">+</span> Add New Skill
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 h-fit">
                            <input
                                type="text"
                                autoFocus
                                placeholder="Type and press Enter..."
                                value={newSkillInput}
                                onChange={(e) => setNewSkillInput(e.target.value)}
                                onKeyDown={handleAddSkill}
                                onBlur={() => setIsAddingSkill(false)} // Hides input if they click away
                                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            </div>
                        )}
                        </div>
                    </div>
                    {/*  END SPECIAL SKILLS SECTION  */}
                </div>
                {/* Languages */}
                <div className="mt-4 mb-2 col-span-full">
                    
                    {/*  LANGUAGES SECTION  */}
                    <div className="mt-4 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Languages</h3>
                        <p className="text-sm text-gray-400 mb-3">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        </p>
                        
                        <div className="bg-[#f4f4f4] rounded-xl p-6 min-h-[120px] flex flex-wrap content-start gap-3">              
                        {/* Render the selected languages as chips */}
                        {selectedLanguages.map((language, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-md px-3 py-1.5 flex items-center gap-2 text-sm text-gray-700 shadow-sm h-fit">
                            {language}
                            <button 
                                type="button" 
                                onClick={() => removeLanguage(language)} 
                                className="text-gray-400 hover:text-red-500 font-bold"
                            >
                                ×
                            </button>
                            </div>
                        ))}

                        {/* The + Add New Language Button / Input */}
                        {!isAddingLanguage ? (
                            <button
                            type="button"
                            onClick={() => setIsAddingLanguage(true)}
                            className="bg-white border border-gray-200 shadow-sm rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors h-fit"
                            >
                            <span className="text-gray-400 text-lg leading-none font-light">+</span> Add New Language
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 h-fit">
                            <input
                                type="text"
                                autoFocus
                                placeholder="Type and press Enter..."
                                value={newLanguageInput}
                                onChange={(e) => setNewLanguageInput(e.target.value)}
                                onKeyDown={handleAddLanguage}
                                onBlur={() => setIsAddingLanguage(false)} // Hides input if they click away
                                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            </div>
                        )}
                        </div>
                    </div>
                    {/*  END LANGUAGES SECTION  */}
                </div>
                {/* Preferences */}
                <div className="col-span-full relative">
                    <h3 className="font-semibold text-gray-900 mb-1">Assignment Preferences</h3>
                    {/* PREFERENCES GRID */}
                    <div className="mt-2 relative">
                        <h3 className="font-semibold mb-1">Assignment Preferences</h3>
                        
                        {/* The Dropdown Button */}
                        <button
                        type="button"
                        onClick={() => setIsPreferenceDropdownOpen(!isPreferenceDropdownOpen)}
                        className="input-style w-full flex justify-between items-center text-left bg-white"
                        >
                        <span className={selectedPreferenceIds.length === 0 ? "text-gray-400" : "text-black"}>
                            {selectedPreferenceIds.length > 0
                            ? `${selectedPreferenceIds.length} preference(s) selected`
                            : "Select Preferences..."}
                        </span>
                        <span className="text-gray-400 text-xs">▼</span>
                        </button>

                        {/* The Checkbox Menu */}
                        {isPreferenceDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 flex flex-col gap-1">
                            {PREFERENCE_OPTIONS.map((pref) => (
                            <label 
                                key={pref.id} 
                                className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded transition-colors"
                            >
                                <input
                                type="checkbox"
                                checked={selectedPreferenceIds.includes(pref.id)}
                                onChange={() => handlePreferenceToggle(pref.id)}
                                className="w-4 h-4 text-primary focus:ring-primary rounded border-gray-300"
                                />
                                <span className="text-sm text-gray-700 font-medium">{pref.label}</span>
                            </label>
                            ))}
                        </div>
                        )}
                    </div>
                    {/* END PREFERENCES SECTION */}
                </div>
                {/* Sub duty and Address */}
                <div className="grid grid-cols-2 gap-4 col-span-full">
                    <div className="flex flex-col gap-1">
                        <label className="form-label" htmlFor="address">Address</label>
                        <input required className="input-style" type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="form-label" htmlFor="max_distance_preferred">Max Travel Distance (miles)</label>
                        <input className="input-style" type="number" name="max_distance_preferred" placeholder="Max Travel Distance (miles)" value={formData.max_distance_preferred} onChange={handleChange} />
                    </div>
                  
                    <div className="col-span-full pt-2 flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            name="sub_duty_preference"
                            checked={formData.sub_duty_preference }
                            onChange={(e) => setFormData(prev => ({ ...prev, sub_duty_preference: e.target.checked }))}
                            className="w-4 h-4 text-primary focus:ring-primary rounded border-gray-300" 
                        />
                        <label className="text-sm font-medium text-gray-700" htmlFor="sub_duty_preference">Available for Sub Duty?</label>                    
                    </div>
                </div>
            </div>
          </section>

        </form>
      </div>
    </div>
  );
}