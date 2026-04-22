"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import EditVolunteerModal from "../volunteers/components/EditVolunteerModal"; 
import { UserData } from "../volunteers/types/volunteer";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken;
  const userId = (session?.user as any)?.id; //retriever user id for all users
  const role = (session?.user as any)?.role; // Retrieve the user's role

  const [baseUser, setBaseUser] = useState<any>(null); // State for all users  
  const [volunteerData, setVolunteerData] = useState<UserData | null>(null);   // State specifically for Volunteers
  const [volunteerId, setVolunteerId] = useState<number | null>(null);  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    async function fetchProfileData() {
      if (status !== "authenticated" || !token || !userId) return;

      try {
        // Fetch base User data for ALL roles using the direct Primary Key URL
        const userRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${userId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Fetching user with ID:", userId, "at URL:", `${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${userId}/`);
        if (!userRes.ok) throw new Error("Failed to fetch base user profile");
        const userData = await userRes.json();
        setBaseUser(userData);

        // Conditionally fetch Volunteer data ONLY if the role is VOLUN
        if (role === "VOLUN") {
          const volRes = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/volunteers/?user_id=${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log("fetching volunteer with user id:", userId);
          if (volRes.ok) {
            const volData = await volRes.json();
            
            if (volData && volData.length > 0) {
              // Cast both the nested Django ID and the NextAuth ID to strings
              const matchedVolunteer = volData.find((vol: any) => 
                String(vol.user?.id) === String(userId)
              );

              if (matchedVolunteer) {
                setVolunteerData(matchedVolunteer);
                setVolunteerId(matchedVolunteer.id); 
                console.log("Fetched volunteer data:", matchedVolunteer.id);
              } else {
                console.warn("No volunteer record matches this account's User ID.");
              }
            }
          }

        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfileData();
  }, [status, token, userId, role]);

  if (isLoading || status === "loading") {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  if (!baseUser) {
    return (
      <div className="p-8 text-center text-red-500">
        Could not load profile details for this account.
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
            <p className="text-gray-500 mt-1">
              Account Type: <span className="font-semibold text-gray-700">{role}</span>
            </p>
          </div>
          
          {/* Only show the Edit Modal to Volunteers */}
          {role === "VOLUN" && volunteerId && (
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="bg-[#9F0059] text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-800 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Display Data Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Base User Data*/}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Account Information</h2>
            <ul className="space-y-3 text-gray-600">
              <li><strong className="text-gray-900">Name:</strong> {baseUser.first_name} {baseUser.last_name}</li>
              <li><strong className="text-gray-900">Email:</strong> {baseUser.email}</li>
              <li><strong className="text-gray-900">Username:</strong> {baseUser.username}</li>
            </ul>
          </div>

          {/* Volunteer-Specific Data*/}
          {role === "VOLUN" && volunteerData && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Volunteer Details</h2>
              <ul className="space-y-3 text-gray-600">
                <li><strong className="text-gray-900">Phone:</strong> {volunteerData.phone_number || "Not provided"}</li>
                <li><strong className="text-gray-900">Address:</strong> {volunteerData.address || "Not provided"}</li>
                <li><strong className="text-gray-900">Team:</strong> {volunteerData.team || "Unassigned"}</li>
                <li><strong className="text-gray-900">Max Distance:</strong> {volunteerData.max_distance_preferred} miles</li>
                <li><strong className="text-gray-900">Sub Duty:</strong> {volunteerData.sub_duty_preference ? "Yes" : "No"}</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Render modal exclusively for Volunteers */}
      {isEditModalOpen && volunteerId && role === "VOLUN" && (
        <EditVolunteerModal
          volunteerId={volunteerId}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updatedUser) => {
            setVolunteerData(updatedUser); 
            // Update the base user display optimistically
            setBaseUser((prev: any) => ({
              ...prev,
              first_name: updatedUser.user.first_name,
              last_name: updatedUser.user.last_name,
              email: updatedUser.user.email,
            }));
            setIsEditModalOpen(false);
          }}
        />
      )}
    </main>
  );
}
