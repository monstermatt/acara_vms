"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { UserData } from "@/app/volunteers/types/volunteer"; 
//import Cookies from "js-cookie"; // For handling auth token

interface CreateUserModalProps {
  onClose: () => void;
  // update the table on successful creation by passing the new user data back to the parent component
  onSuccess: (newUser: UserData) => void; 
}

export default function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
  const {data: session, status} = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flattened for easier handling
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

    // Get token from cookies
    const token = (session as any)?.accessToken;
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    //console.log("Token from cookies:", token);
    // Match Django nested serializer expectation
    const payload = {
      user: {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
      },
      phone_number: formData.phone_number,
      gender: formData.gender,
      address: formData.address,
      age_group: formData.age_group,
      max_distance_preferred: Number(formData.max_distance_preferred),
      sub_duty_preference: false,
      skills: [],
      languages: [],
      preferences: []
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/volunteers/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Django/NexAuth API auth
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("DRF Error:", errorData);
        throw new Error(errorData?.detail || `API Error: ${response.status}`);
      }

      const createdUser: UserData = await response.json();
      onSuccess(createdUser); // Update the table//
      onClose(); // Close the modal
    } catch (err: any) {
      console.error("Failed to create volunteer:", err);
      setError(err.message || "Failed to create volunteer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50' onClick={onClose}>
      <div className='bg-white p-8 rounded-lg max-w-md w-full relative' onClick={(e) => e.stopPropagation()}>
        <button className='absolute top-4 right-4 text-gray-500 hover:text-black' onClick={onClose}>x</button>
        
        <h2 className='text-xl font-bold mb-4'>Create New Volunteer</h2>

        {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input required className="input-style border p-2 rounded" type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} />
          <input required className="input-style border p-2 rounded" type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} />
          <div className="flex gap-2">
            <input required className="input-style border p-2 rounded w-full" type="text" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} />
            <input required className="input-style border p-2 rounded w-full" type="text" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} />
          </div>
          <input required className="input-style border p-2 rounded" type="text" name="address" placeholder="Home Address" value={formData.address} onChange={handleChange} />
          <input className="input-style border p-2 rounded" type="text" name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} />
          <select className="input-style border p-2 rounded" name="age_group" value={formData.age_group} onChange={handleChange}>
            <option value="">Select Age Group</option>
            <option value="AGEGROUP1">18-25</option>
            <option value="AGEGROUP2">26-50</option>
            <option value="AGEGROUP3">51+</option>
          </select>
          <select className="input-style border p-2 rounded" name="gender" value={formData.gender} onChange={handleChange}>
            <option value="">Select Gender</option>
            <option value="F">Female</option>
            <option value="M">Male</option>
            <option value="O">Non-binary</option>
          </select>

          <input className="input-style border p-2 rounded" type="number" name="max_distance_preferred" placeholder="Max Travel Distance (miles)" value={formData.max_distance_preferred} onChange={handleChange} />

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`mt-4 p-2 text-white rounded ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubmitting ? "Creating..." : "Create Volunteer"}
          </button>
        </form>
      </div>
    </div>
  );
}