import SummaryCard from "../components/SummaryCard";

import {CalendarSummaryIcon, AppToDateIcon, AppOnTimeSummaryIcon} from '@/icons'
import AppointmentsView from "../components/AppoitmentsView";

import { VolunteerVisit } from "../volunteers/types/visits";


export default async function DashboardPage() {
  const [volRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/visits`, {
      cache: "no-store",
    }),
  ]);

  if (!volRes.ok) {
    console.error("Failed to fetch data for dashboard");
    return <div className="p-8 text-center text-red-500">Error Loading: Danger Will Robinson</div>;
  }else{
    console.log("Successfully fetched data for dashboard");
  }

  const visitsData: VolunteerVisit[] = await volRes.json();

  console.log("Visits Data:", visitsData);

  return (
    <>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#9f0059] mb-4">Dashboard</h1>
        <p className="text-gray-600">Here is what is going where you where gone</p>
      </div>

      <div className="flex gap-4 px-8">
        <SummaryCard title="Today's Appointments" value={480} icon={<CalendarSummaryIcon />} />
        <SummaryCard title="Monthly Appointments to date" value={120} icon={<AppToDateIcon />} />
        <SummaryCard title="Appointments on time" value="75%" icon={<AppOnTimeSummaryIcon />} />
      </div>

      <div className="p-8 mb-15">
        <AppointmentsView visits={visitsData} />
      </div>

    </>
  );
}
