"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserData } from "@/app/volunteers/types/volunteer";
import WeeklyScheduleBuilder, { TimeSlot } from "./WeeklyScheduleBuilder"; 
import { EditIcon, UserIcon } from "@/icons";

interface EditVolunteerModalProps {
  volunteerId: number;
  onClose: () => void;
  onSuccess: (updatedUser: UserData) => void; 
}

export default function EditVolunteerModal({ volunteerId, onClose, onSuccess }: EditVolunteerModalProps) {
  const { data: session } = useSession();
  
  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form States
  const [availabilities, setAvailabilities] = useState<TimeSlot[]>([]);
  const [initialAvailabilityIds, setInitialAvailabilityIds] = useState<number[]>([]); // Track old ones to delete
  
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");
  
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [newLanguageInput, setNewLanguageInput] = useState("");
  
  const [isPreferenceDropdownOpen, setIsPreferenceDropdownOpen] = useState(false);
  const [selectedPreferenceIds, setSelectedPreferenceIds] = useState<number[]>([]);
  const PREFERENCE_OPTIONS = [
    { id: 1, label: "Office" },
    { id: 2, label: "Patient" },
    { id: 3, label: "Facility" },
  ];

  // The base User ID (needed to PATCH the user profile)
  const [baseUserId, setBaseUserId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    gender: "",
    max_distance_preferred: 0,
    address: "",
    age_group: "",
    team: "",
    sub_duty_preference: false,
  });

  // Fethch volunteer data on mount
  useEffect(() => {
    const fetchVolunteerData = async () => {
      const token = (session as any)?.accessToken;
      if (!token) return;

      try {
        //Fetch Volunteer
        const volRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/volunteers/${volunteerId}/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!volRes.ok) throw new Error("Failed to load volunteer data");
        const volData = await volRes.json();

        //Fetch Availabilities
        const availRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/availability/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const availData = await availRes.json();
        const myAvails = availData.filter((a: any) => a.volunteer === volunteerId);

        // Set form states
        setBaseUserId(volData.user.id);
        
        setFormData({
          email: volData.user.email || "",
          first_name: volData.user.first_name || "",
          last_name: volData.user.last_name || "",
          phone_number: volData.phone_number || "",
          gender: volData.gender || "",
          max_distance_preferred: volData.max_distance_preferred || 0,
          address: volData.address || "",
          age_group: volData.age_group || "",
          team: volData.team || "",
          sub_duty_preference: volData.sub_duty_preference || false,
        });

        // Map arrays 
        setSelectedSkills(volData.skills?.map((s: any) => s.skill_name) || []);
        setSelectedLanguages(volData.languages?.map((l: any) => l.language_name) || []);
        setSelectedPreferenceIds(volData.preferences?.map((p: any) => p.id) || []);
        
        // Map availabilities
        setInitialAvailabilityIds(myAvails.map((a: any) => a.id));
        setAvailabilities(myAvails.map((a: any) => ({
          dayofweek: a.dayofweek,
          start_time: a.start_time,
          end_time: a.end_time,
        })));

      } catch (err) {
        console.error(err);
        setError("Could not load volunteer data.");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchVolunteerData();
  }, [volunteerId, session]);

  // handlers for dynamic fields
  const handlePreferenceToggle = (id: number) => {
    setSelectedPreferenceIds((prev) =>
      prev.includes(id) ? prev.filter((prevId) => prevId !== id) : [...prev, id]
    );
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
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
      e.preventDefault();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // Submit handler: Update User, then Volunteer, then Availabilities
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const token = (session as any)?.accessToken;
    if (!token || !baseUserId) {
      setError("Authentication or data error. Please try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      //PATCH the base User
      const userPayload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email, 
      };

      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${baseUserId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(userPayload),
      });

      // Resolve Skills IDs (Create new ones if they don't exist)
      let currentSkillIds: number[] = [];
      if (selectedSkills.length > 0) {
        const skillPromises = selectedSkills.map(async (skillName) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/skills/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ skill_name: skillName }),
          });
          const data = await res.json();
          return data.id || data.skill_id; 
        });
        currentSkillIds = (await Promise.all(skillPromises)).filter(id => id != null);
      }

      //Resolve Language IDs
      let currentLanguageIds: number[] = [];
      if (selectedLanguages.length > 0) {
        const languagePromises = selectedLanguages.map(async (languageName) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/languages/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ language_name: languageName }),
          });
          const data = await res.json();
          return data.id || data.language_id;
        });
        currentLanguageIds = (await Promise.all(languagePromises)).filter(id => id != null);
      }

      //PATCH the Volunteer Profile
      const volunteerPayload = {
        user_id: baseUserId,
        phone_number: formData.phone_number,
        address: formData.address,
        age_group: formData.age_group,
        gender: formData.gender,
        max_distance_preferred: Number(formData.max_distance_preferred),
        team: formData.team,
        sub_duty_preference: formData.sub_duty_preference,
        skills: currentSkillIds, 
        languages: currentLanguageIds, 
        preferences: selectedPreferenceIds, 
      };

      const volResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/volunteers/${volunteerId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(volunteerPayload),
      });

      if (!volResponse.ok) throw new Error("Failed to update Volunteer profile.");
      const updatedVolunteer = await volResponse.json();

      // Update AvailabilitySchedule (Safest method: Delete old, Post new)
      // Delete old
      await Promise.all(initialAvailabilityIds.map(async (id) => {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/availability/${id}/`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` },
        });
      }));

      // Post new
      const newAvails: any[] = [];
      if (availabilities.length > 0) {
        await Promise.all(availabilities.map(async (slot) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/availability/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({
              volunteer: volunteerId,
              dayofweek: slot.dayofweek,
              start_time: slot.start_time,
              end_time: slot.end_time,
            }),
          });
          if(res.ok) newAvails.push(await res.json());
        }));
      }

      //Update Table Optimistically
      const completeUserData: UserData = {
        id: volunteerId,
        user: {
          id: baseUserId,
          username: formData.email, 
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
        },
        gender: updatedVolunteer.gender,
        phone_number: updatedVolunteer.phone_number,
        address: updatedVolunteer.address,
        age_group: updatedVolunteer.age_group,
        max_distance_preferred: updatedVolunteer.max_distance_preferred,
        sub_duty_preference: updatedVolunteer.sub_duty_preference,
        team: updatedVolunteer.team,
        skills: selectedSkills.map((name, idx) => ({ skill_id: currentSkillIds[idx] || idx, skill_name: name })),
        languages: selectedLanguages.map((name, idx) => ({ language_id: currentLanguageIds[idx] || idx, language_name: name })),
        preferences: selectedPreferenceIds.map(id => {
          const match = PREFERENCE_OPTIONS.find(opt => opt.id === id);
          return { pref_id: id, preference: match ? match.label : "Unknown" };
        }),
        availability: newAvails as any,
      };

      onSuccess(completeUserData);
      onClose(); 

    } catch (err: any) {
      console.error("Failed to update volunteer:", err);
      setError(err.message || "Failed to update volunteer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'>
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-primary-maroon border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Loading volunteer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto bg-background-alt p-8'>
      <div className='main-container'>
        
        {error && <div className="mb-8 p-4 bg-red-100 text-red-700 text-sm font-semibold rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          
          <div className="sticky top-0 z-20 bg-background-alt py-4 -mt-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="page-header">Edit Volunteer</h1>
              <p className="text-gray-500 mt-1">Update details for {formData.first_name} {formData.last_name}</p>
            </div>
            <div className="flex gap-4 mt-2">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-save" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* GENERAL INFO */}
          <section className="info-card">
            <h2 className="section-header">General Info</h2>
            <div className="flex flex-col md:flex-row gap-10 items-start">
              <div className="flex flex-col items-center flex-shrink-0 w-40">
                <div className="w-40 h-40 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 mb-4 border border-gray-300">
                  <UserIcon size={64} className="text-gray-500" strokeWidth={1} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 flex-grow">
                <div className="flex flex-col gap-1">
                  <label className="form-label" htmlFor="first_name">Name</label>
                  <input required className="input-style" type="text" name="first_name" value={formData.first_name} onChange={handleChange} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="form-label" htmlFor="last_name">Surname</label>
                  <input required className="input-style" type="text" name="last_name" value={formData.last_name} onChange={handleChange} />
                </div>
                <div className="flex flex-col gap-1 col-span-full">
                  <label className="form-label" htmlFor="email">Email address</label>
                  <input required className="input-style" type="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="flex flex-col gap-1 col-span-full">
                  <label className="form-label" htmlFor="phone_number">Phone Number</label>
                  <input className="input-style" type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="form-label" htmlFor="gender">Gender</label>
                  <select className="input-style" name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="">Select Gender</option>
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                    <option value="O">Non-binary</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="form-label" htmlFor="age_group">Age range</label>
                  <select className="input-style" name="age_group" value={formData.age_group} onChange={handleChange}>
                    <option value="">Select Age Group</option>
                    <option value="AGEGROUP1">18-25</option>
                    <option value="AGEGROUP2">26-50</option>
                    <option value="AGEGROUP3">51+</option>
                  </select>
                </div>
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

          {/* ADDITIONAL INFORMATION */}
          <section className="info-card">
            <h2 className="section-header">Additional Information</h2>
            
            <div className="bg-[#f4f4f4] rounded-2xl p-6 mb-8 col-span-full">
               {/*WeeklyScheduleBuilder */}
              <WeeklyScheduleBuilder
              initialData ={availabilities}
              onScheduleChange={setAvailabilities} />
            </div>

            <div className="grid grid-cols-1 gap-6 pt-6 border-t border-gray-100">
                {/* SKILLS */}
                <div className="mt-4 mb-2 col-span-full">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Special Skills</h3>
                    <div className="bg-[#f4f4f4] rounded-xl p-6 min-h-[120px] flex flex-wrap content-start gap-3">              
                      {selectedSkills.map((skill, index) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-md px-3 py-1.5 flex items-center gap-2 text-sm text-gray-700 shadow-sm h-fit">
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} className="text-gray-400 hover:text-red-500 font-bold">×</button>
                          </div>
                      ))}
                      {!isAddingSkill ? (
                          <button type="button" onClick={() => setIsAddingSkill(true)} className="bg-white border border-gray-200 shadow-sm rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors h-fit">
                          <span className="text-gray-400 text-lg leading-none font-light">+</span> Add New Skill
                          </button>
                      ) : (
                          <input type="text" autoFocus placeholder="Type and press Enter..." value={newSkillInput} onChange={(e) => setNewSkillInput(e.target.value)} onKeyDown={handleAddSkill} onBlur={() => setIsAddingSkill(false)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#9F0059]" />
                      )}
                    </div>
                </div>

                {/* LANGUAGES */}
                <div className="mt-4 mb-2 col-span-full">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Languages</h3>
                    <div className="bg-[#f4f4f4] rounded-xl p-6 min-h-[120px] flex flex-wrap content-start gap-3">              
                      {selectedLanguages.map((language, index) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-md px-3 py-1.5 flex items-center gap-2 text-sm text-gray-700 shadow-sm h-fit">
                          {language}
                          <button type="button" onClick={() => removeLanguage(language)} className="text-gray-400 hover:text-red-500 font-bold">×</button>
                          </div>
                      ))}
                      {!isAddingLanguage ? (
                          <button type="button" onClick={() => setIsAddingLanguage(true)} className="bg-white border border-gray-200 shadow-sm rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors h-fit">
                          <span className="text-gray-400 text-lg leading-none font-light">+</span> Add New Language
                          </button>
                      ) : (
                          <input type="text" autoFocus placeholder="Type and press Enter..." value={newLanguageInput} onChange={(e) => setNewLanguageInput(e.target.value)} onKeyDown={handleAddLanguage} onBlur={() => setIsAddingLanguage(false)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#9F0059]" />
                      )}
                    </div>
                </div>

                {/* PREFERENCES */}
                <div className="col-span-full relative">
                    <h3 className="font-semibold mb-1">Assignment Preferences</h3>
                    <button type="button" onClick={() => setIsPreferenceDropdownOpen(!isPreferenceDropdownOpen)} className="input-style w-full flex justify-between items-center text-left bg-white">
                      <span className={selectedPreferenceIds.length === 0 ? "text-gray-400" : "text-black"}>
                          {selectedPreferenceIds.length > 0 ? `${selectedPreferenceIds.length} preference(s) selected` : "Select Preferences..."}
                      </span>
                      <span className="text-gray-400 text-xs">▼</span>
                    </button>

                    {isPreferenceDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 flex flex-col gap-1">
                        {PREFERENCE_OPTIONS.map((pref) => (
                        <label key={pref.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded transition-colors">
                            <input type="checkbox" checked={selectedPreferenceIds.includes(pref.id)} onChange={() => handlePreferenceToggle(pref.id)} className="w-4 h-4 text-[#9F0059] focus:ring-[#9F0059] rounded border-gray-300" />
                            <span className="text-sm text-gray-700 font-medium">{pref.label}</span>
                        </label>
                        ))}
                    </div>
                    )}
                </div>

                {/* SUB DUTY & ADDRESS */}
                <div className="grid grid-cols-2 gap-4 col-span-full">
                    <div className="flex flex-col gap-1">
                        <label className="form-label" htmlFor="address">Address</label>
                        <input className="input-style" type="text" name="address" value={formData.address} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="form-label" htmlFor="max_distance_preferred">Max Travel Distance (miles)</label>
                        <input className="input-style" type="number" name="max_distance_preferred" value={formData.max_distance_preferred} onChange={handleChange} />
                    </div>
                    <div className="col-span-full pt-2 flex items-center gap-2">
                        <input type="checkbox" name="sub_duty_preference" id="sub_duty_preference" checked={formData.sub_duty_preference} onChange={handleChange} className="w-4 h-4 text-[#9F0059] focus:ring-[#9F0059] rounded border-gray-300" />
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