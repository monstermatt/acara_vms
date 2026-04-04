"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { UserData } from "@/app/volunteers/types/volunteer"; 

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: (newUser: UserData) => void; 
}

export default function CreateVolunteerModal({ onClose, onSuccess }: CreateUserModalProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      //Create the User
      const userPayload = {
        username: formData.email,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: "VOLUN" // Static role assignment for volunteers; adjust as needed
      };

      const userResponse = await fetch("http://127.0.0.1:8000/api/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(userPayload),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => null);

        // console.error("DRF ERROR:", errorData);

        if (errorData && typeof errorData === 'object' && !errorData.detail) {
           const errorMessages = Object.entries(errorData)
              .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
              .join(' | ');
           throw new Error(`Validation Error - ${errorMessages}`);
        }

        throw new Error(errorData?.detail || errorData?.username?.[0] || `Failed to create User account (Status: ${userResponse.status})`);
      }

      const createdUser = await userResponse.json();

      // Create the Volunteer profile linked to the User
      const volunteerPayload = {
        user_id: createdUser.id || createdUser.pk, // match what DRF returns
        phone_number: formData.phone_number,
        address: formData.address,
        age_group: formData.age_group,
        gender: formData.gender,
        max_distance_preferred: Number(formData.max_distance_preferred),
        sub_duty_preference: false,
      };

      const volResponse = await fetch("http://127.0.0.1:8000/api/volunteers/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(volunteerPayload),
      });

      if (!volResponse.ok) {
        const errorData = await volResponse.json().catch(() => null);
        throw new Error(errorData?.detail || `Failed to create Volunteer profile (Status: ${volResponse.status})`);
      }

      const createdVolunteer = await volResponse.json();

      // Update Table without refetching.
      const completeUserData: UserData = {
        id: createdVolunteer.id || createdVolunteer.pk,
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
        skills: [],
        languages: [],
        preferences: [],
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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50' onClick={onClose}>
      <div className='bg-white p-8 rounded-lg max-w-full w-full relative' onClick={(e) => e.stopPropagation()}>
        <button className='absolute top-4 right-4 text-gray-500 hover:text-black' onClick={onClose}>x</button>
        
        <h2 className='page-header'>New Volunteer</h2>

        {error && <div className="mb-4 text-red-500 text-sm font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          
          <fieldset className="table-container">
            <h2 className="page-header">General Info</h2>
          <div className="flex gap-2">
            <input required className="input-style" type="text" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} />
            <input required className="input-style" type="text" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} />
          </div>
          <input required className="input-style" type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} />
          <input required className="input-style" type="text" name="address" placeholder="Home Address" value={formData.address} onChange={handleChange} />
          <div className="flex gap-2">
          <input className="input-style" type="text" name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} />
          <select className="input-style" name="age_group" value={formData.age_group} onChange={handleChange}>
            <option value="">Select Age Group</option>
            <option value="AGEGROUP1">18-25</option>
            <option value="AGEGROUP2">26-50</option>
            <option value="AGEGROUP3">51+</option>
          </select>
          </div>
          <div className="flex gap-2">
          <select className="input-style" name="gender" value={formData.gender} onChange={handleChange}>
            <option value="">Select Gender</option>
            <option value="F">Female</option>
            <option value="M">Male</option>
            <option value="O">Non-binary</option>
          </select>
          <select className='input-style' name = "team" value={formData.team}onChange={handleChange}>
            <option value ="">Select Team</option>
            <option value = "A">Team A</option>
            <option value = "B">Team B</option>
            <option value = "C">Team C</option>
          </select>
          </div>
          </fieldset>
          <fieldset className="table-container">
            <h2 className="page-header">Additional Information</h2>
            <h3>Special Skills</h3>
            <h3>Preferences</h3>
            <h3>Travel Distance</h3>
            <h3>Assignment Preferenc</h3>
            <select className = "input-style" name="Assignment Preference" value = {formData.assigment_preference} onChange={handleChange}>
              <option value =''>Select Preference</option>
              <option value = 'Office'>Office</option>
              <option value = 'Patient'>Patient</option>
            </select>
            <input className="input-style" type="number" name="max_distance_preferred" placeholder="Max Travel Distance (miles)" value={formData.max_distance_preferred} onChange={handleChange} />
          </fieldset>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`mt-4 p-2 text-white rounded font-bold transition-colors ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'active-button'}`}
          >
            {isSubmitting ? "Creating..." : "Create Volunteer"}
          </button>
        </form>
      </div>
    </div>
  );
}