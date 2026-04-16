'use client';
import AuditView from "@/app/components/AuditView";
import AppointmentsView from "@/app/components/AppoitmentsView";
import SummaryCard from "../../components/SummaryCard";

import {CalendarSummaryIcon, ChartLateSummaryIcon, AppOnTimeSummaryIcon} from '@/icons'
import { VolunteerVisit } from "../types/visits";
import { useEffect, useMemo, useState } from "react";
import { getVisits } from "../../api/getVisits";


export default function VolunteerReportingPage() {
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
    <main>
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#9f0059] mb-4">Reporting</h1>
      <p className="text-gray-600">Here are today’s volunteer meetings and audit</p>
    </div>

    <div className = 'flex gap-4 px-8'>
      <SummaryCard title="Appointments this month" value={visits.length} icon={<CalendarSummaryIcon />} />
      <SummaryCard title="Charted Late" value={visits.length} icon={<ChartLateSummaryIcon />} />
      <SummaryCard title="Appointments on time (%)" value="75%" icon={<AppOnTimeSummaryIcon />} />
    </div>

    <div className="pl-8 pr-8 mb-15">
      <AuditView />
      <AppointmentsView visits={visits} />
    </div>
    </main>
  );
}

