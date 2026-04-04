import ManageDashboard from "@/app/volunteers/components/VolunteerOverviewDashboard";
import { UserData } from "../types/volunteer";

export default async function VolunteerOverviewPage() {
  const res = await fetch("http://127.0.0.1:8000/api/volunteers/", {
    cache: "no-store", 
  });

  if (!res.ok) {
    return <div className="p-8 text-center text-red-500">Error Loading API Data</div>;
  }

  const volunteers: UserData[] = await res.json();

  return (
    <main className="min-h-screen p-8">
      <header className="mb-8">
        <h2 className="page-header text-2xl font-bold">Volunteer Overview</h2>
        <p className="text-gray-500">All Volunteers</p>
      </header>

      <ManageDashboard initialVolunteers={volunteers} />
    </main>
  );
}