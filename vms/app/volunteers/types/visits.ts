import {UserData} from "./volunteer";

export interface VolunteerVisit {
  id: number;
  volunteer: UserData;
  schedule: number | null; // or a Schedule object | null, depending on your API
  visit_date: string;
  visit_start_time: string;
  visit_end_time: string;
  charted: boolean;
  visited: boolean;
  created_at: string;
  updated_at: string;
}


 
  
  