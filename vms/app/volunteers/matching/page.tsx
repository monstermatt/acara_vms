import MatchingDashboard from "@/app/volunteers/components/VolunteerMatchingDashboard";
import { UserData } from "../types/volunteer";

export default async function MatchingPage() {
  // Note: Using a full URL is required for server-side fetching
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/volunteers/`, {
    cache: "no-store", // Ensures fresh data is pulled on every request
  });

  if (!res.ok) {
    return <div className="p-8 text-center text-red-500">Error Loading: Danger Will Robinson</div>;
  }

  const volunteers: UserData[] = await res.json();

  return (
    <main className="min-h-screen p-8">
      <header className="mb-8">
        <h2 className="page-header text-2xl font-bold">Volunteer Matching</h2>
        <p className="text-gray-500">It's not Tinder, but it works.</p>
      </header>

      <MatchingDashboard initialVolunteers={volunteers} />
    </main>
  );
}