
import { DayOfWeek } from "../types/volunteer";

export interface VolunteerSchedule {
  id: number;
  start_date: string;
  end_date: string;
  dayofweek: DayOfWeek | string;
  start_time: string;
  end_time: string;
  volunteer_id: number;
}