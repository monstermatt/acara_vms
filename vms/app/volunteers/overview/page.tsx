import ManageDashboard from "@/app/volunteers/components/VolunteerOverviewDashboard";
import { UserData, NestedAvailability } from "../types/volunteer";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 

export default async function VolunteerOverviewPage() {
  try {
    const session = await getServerSession(authOptions);
    const token = (session as any)?.accessToken;

    // Fetch both endpoints 
    const [volRes, availRes] = await Promise.all([
      fetch("http://127.0.0.1:8000/api/volunteers/", {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` }) // Only add the Authorization header if a token exists
        }
      }),
      fetch("http://127.0.0.1:8000/api/availability/", {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` }) 
        },
      }),
    ]);

    if (!volRes.ok || !availRes.ok) {
      return <div className="p-8 text-center text-red-500">Error Loading API Data</div>;
    }

    const volunteersData: UserData[] = await volRes.json();
    const availabilityData: (NestedAvailability & { volunteer: number })[] = await availRes.json();

    // Merge the datasets
    const mergedVolunteers: UserData[] = volunteersData.map((vol) => ({
      ...vol,
      availability: availabilityData.filter((avail) => avail.volunteer === vol.id),
    }));

    return (
      <main className="min-h-screen p-8">
        <header className="mb-8">
          <h2 className="page-header text-2xl font-bold">Volunteer Overview</h2>
          <p className="text-gray-500">All Volunteers</p>
        </header>

        <ManageDashboard initialVolunteers={mergedVolunteers} />
      </main>
    );
  } catch (error) {
    console.error("Failed to fetch volunteer data:", error);
    return <div className="p-8 text-center text-red-500">Error Loading API Data</div>;
  }
}