import MatchingDashboard from "@/app/volunteers/components/VolunteerMatchingDashboard";
import { UserData } from "../types/volunteer";
import { NestedAvailability} from "../types/volunteer";

export default async function MatchingPage() {
  // Note: Using a full URL is required for server-side fetching
  const [volRes, availRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/volunteers/`, {
    cache: "no-store", // Ensures fresh data is pulled on every request
    }),
    fetch (`${process.env.NEXT_PUBLIC_BASE_URL}/api/availability`, {
    cache: "no-store",
    }),
  ]);

  if (!volRes.ok || !availRes.ok) {
    return <div className="p-8 text-center text-red-500">Error Loading: Danger Will Robinson</div>;
  }
  const volunteerData: UserData[] = await volRes.json();
  const availabilityData: (NestedAvailability & {volunteer: number})[] = await availRes.json();
  const mergedVolunteers: UserData[] = volunteerData.map((vol) => ({
    ...vol,
    availability: availabilityData.filter((avail) => avail.volunteer === vol.id),

  }));

  return (
    <main className="min-h-screen p-8">
      <header className="mb-8">
        <h2 className="page-header text-2xl font-bold">Volunteer Matching</h2>
        <p className="text-gray-500">It's not Tinder, but it works.</p>
      </header>

      <MatchingDashboard initialVolunteers={mergedVolunteers} />
    </main>
  );
}