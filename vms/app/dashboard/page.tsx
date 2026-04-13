import SummaryCard from "../components/SummaryCard";

import {CalendarSummaryIcon, AppToDateIcon, AppOnTimeSummaryIcon} from '@/icons'
import AppointmentsView from "../components/AppoitmentsView";

import { UserData } from "../volunteers/types/volunteer";
import { VolunteerSchedule } from "../volunteers/types/schedule";
import { AppointmentTemplate } from "../components/AppoitmentsView";


export default async function DashboardPage() {
  const [volRes, schedulesRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/volunteers/`, {
      cache: "no-store",
    }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/schedules`, {
      cache: "no-store",
    }),
  ]);

  if (!volRes.ok || !schedulesRes.ok) {
    return <div className="p-8 text-center text-red-500">Error Loading: Danger Will Robinson</div>;
  }

  const volunteerData: UserData[] = await volRes.json();
  const schedulesData: (VolunteerSchedule & { volunteer: number })[] = await schedulesRes.json();

  type VolunteerWithSchedules = UserData & {
  schedules: (VolunteerSchedule & { volunteer: number })[];
};

const mergedVolunteers: VolunteerWithSchedules[] = volunteerData
  .map((vol) => ({
    ...vol,
    schedules: schedulesData.filter((sched) => sched.volunteer === vol.id),
  }))
  .filter((vol) => vol.schedules.length > 0);

  const appointments: AppointmentTemplate[] = mergedVolunteers.flatMap((vol) =>
    vol.schedules.map((sched) => ({
      id: sched.id,
      volunteer_name: `${vol.user.first_name} ${vol.user.last_name}`,
      volunteer_phone: vol.phone_number,
      appointment_time: sched.start_time,
      appointment_status: "",
    }))
  );

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
        <AppointmentsView schedules={appointments} />
      </div>

    </>
  );
}
