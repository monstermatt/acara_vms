
import { VolunteerSchedule } from "../volunteers/types/schedule";
import { UserData } from "../volunteers/types/volunteer";

export interface CalendarTemplate {
  id: number;
  volunteer_name: string;
  dayofweek: string;
  start_time: string;
  end_time: string; 
  start_date: string;
  end_date: string;
}


export async function getAppointments(): Promise<CalendarTemplate[]> {
  const [volRes, schedulesRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/volunteers/`, {
      cache: "no-store",
    }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/schedules`, {
      cache: "no-store",
    }),
  ]);

  if (!volRes.ok || !schedulesRes.ok) {
    throw new Error("Failed to fetch data");
  }

  const volunteerData: UserData[] = await volRes.json();
  const schedulesData: (VolunteerSchedule & { volunteer: number })[] =
    await schedulesRes.json();

  type VolunteerWithSchedules = UserData & {
    schedules: (VolunteerSchedule & { volunteer: number })[];
  };

  const mergedVolunteers: VolunteerWithSchedules[] = volunteerData
    .map((vol) => ({
      ...vol,
      schedules: schedulesData.filter((sched) => sched.volunteer === vol.id),
    }))
    .filter((vol) => vol.schedules.length > 0);

  const calAppointments: CalendarTemplate[] = mergedVolunteers.flatMap((vol) =>
    vol.schedules.map((sched) => ({
      id: sched.id,
      volunteer_name: `${vol.user.first_name} ${vol.user.last_name}`,
      dayofweek: sched.dayofweek,
      start_time: sched.start_time,
      end_time: sched.end_time,
      start_date: sched.start_date,
      end_date: sched.end_date,
    }))
  );

  return calAppointments;
}