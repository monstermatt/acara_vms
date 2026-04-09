import SummaryCard from "../components/SummaryCard";

import {CalendarSummaryIcon, AppToDateIcon, AppOnTimeSummaryIcon} from '@/icons'

export default function DashboardPage() {
  return (
    <>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#9f0059] mb-4">Dashboard</h1>
        <p className="text-gray-600">Coming soon</p>
      </div>

      <div className = 'flex gap-4 px-8'>
        <SummaryCard title="Today's Appointments" value={480} icon={<CalendarSummaryIcon />} />
        <SummaryCard title="Monthly Appointments to date" value={120} icon={<AppToDateIcon />} />
        <SummaryCard title="Appointments on time" value="75%" icon={<AppOnTimeSummaryIcon />} />
      </div>
    </>
    
  );
}