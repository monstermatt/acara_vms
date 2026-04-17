"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import EditVolunteerModal from "../volunteers/components/EditVolunteerModal"; // Adjust path if needed
import { UserData } from "../volunteers/types/volunteer";

export default function VolunteerProfilePage() {
  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken;
  const userId = (session?.user as any)?.id; // This is the Django User ID we saved in NextAuth

  const [volunteerData, setVolunteerData] = useState<UserData | null>(null);
  const [volunteerId, setVolunteerId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    async function fetchMyProfile() {
      if (status !== "authenticated" || !token || !userId) return;

      try {
        // Query Django for the volunteer profile linked to this User ID
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/volunteers/?user_id=${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();

        // DRF filters usually return an array. Grab the first match.
        if (data && data.length > 0) {
          setVolunteerData(data[0]);
          setVolunteerId(data[0].id); // This is the Volunteer ID your modal needs!
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMyProfile();
  }, [status, token, userId]);

  if (isLoading || status === "loading") {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  if (!volunteerData) {
    return (
      <div className="p-8 text-center text-red-500">
        No volunteer profile found for this account.
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-background-alt">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8 border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-1">Manage your volunteer information and availability.</p>
          </div>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="bg-[#9F0059] text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-800 transition-colors"
          >
            Edit Profile
          </button>
        </div>

        {/* Display Data Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Contact Information</h2>
            <ul className="space-y-3 text-gray-600">
              <li><strong className="text-gray-900">Name:</strong> {volunteerData.user?.first_name} {volunteerData.user?.last_name}</li>
              <li><strong className="text-gray-900">Email:</strong> {volunteerData.user?.email}</li>
              <li><strong className="text-gray-900">Phone:</strong> {volunteerData.phone_number || "Not provided"}</li>
              <li><strong className="text-gray-900">Address:</strong> {volunteerData.address || "Not provided"}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Volunteer Details</h2>
            <ul className="space-y-3 text-gray-600">
              <li><strong className="text-gray-900">Team:</strong> {volunteerData.team || "Unassigned"}</li>
              <li><strong className="text-gray-900">Max Distance:</strong> {volunteerData.max_distance_preferred} miles</li>
              <li><strong className="text-gray-900">Sub Duty:</strong> {volunteerData.sub_duty_preference ? "Yes" : "No"}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Render modal, passing the correctly extracted Volunteer ID */}
      {isEditModalOpen && volunteerId && (
        <EditVolunteerModal
          volunteerId={volunteerId}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updatedUser) => {
            setVolunteerData(updatedUser); // Update the UI instantly when they save
            setIsEditModalOpen(false);
          }}
        />
      )}
    </main>
  );
}