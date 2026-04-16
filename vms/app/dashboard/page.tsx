'use client';
import SummaryCard from "../components/SummaryCard";

import {CalendarSummaryIcon, AppToDateIcon, AppOnTimeSummaryIcon} from '@/icons'
import AppointmentsView from "../components/AppoitmentsView";

import { VolunteerVisit } from "../volunteers/types/visits";
import { useEffect, useState } from "react";

import { getVisits } from "../api/getVisits";


export default function DashboardPage() { 
  const [visits, setVisits] = useState<VolunteerVisit[]>([]);
  
  useEffect(() => {
    
        async function fetchAppointments() {
          try {
            const appointmentsData = await getVisits();
            setVisits(appointmentsData);
          } catch (error) {
            console.error("Error fetching appointments:", error);
          }
        }
    
        fetchAppointments();
      }, []);


  return ( 
    <>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#9f0059] mb-4">Dashboard</h1>
        <p className="text-gray-600">Here is what is going where you where gone</p>
      </div>

      <div className="flex gap-4 px-8">
        <SummaryCard title="Today's Appointments" value={visits.length} icon={<CalendarSummaryIcon />} />
        <SummaryCard title="Monthly Appointments to date" value={visits.length} icon={<AppToDateIcon />} />
        <SummaryCard title="Appointments on time" value="75%" icon={<AppOnTimeSummaryIcon />} />
      </div>

      <div className="p-8 mb-15">
        <AppointmentsView visits={visits} />
      </div>
    </>
  );
}
