'use client';
import AuditView from "@/app/components/AuditView";
import SummaryCard from "../../components/SummaryCard";

import {CalendarSummaryIcon, ChartLateSummaryIcon, AppOnTimeSummaryIcon} from '@/icons'


export default function VolunteerReportingPage() {
  return (
    <main>
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#9f0059] mb-4">Reporting</h1>
      <p className="text-gray-600">Here are today’s volunteer meetings and audit</p>
    </div>

    <div className = 'flex gap-4 px-8'>
      <SummaryCard title="Appointments this month" value={480} icon={<CalendarSummaryIcon />} />
      <SummaryCard title="Charted Late" value={120} icon={<ChartLateSummaryIcon />} />
      <SummaryCard title="Appointments on time (%)" value="75%" icon={<AppOnTimeSummaryIcon />} />
    </div>

    <AuditView />

    
    </main>
  );
}

