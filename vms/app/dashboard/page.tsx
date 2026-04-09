import SummaryCard from "../components/SummaryCard";

import {CalendarSummaryIcon, AppToDateIcon, AppOnTimeSummaryIcon} from '@/icons'
import AppointmentsView from "../components/AppoitmentsView";

export default function DashboardPage() {
  return (
    <>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#9f0059] mb-4">Dashboard</h1>
        <p className="text-gray-600">Here is what is going where you where gone</p>
      </div>

      <div className = 'flex gap-4 px-8'>
        <SummaryCard title="Today's Appointments" value={480} icon={<CalendarSummaryIcon />} />
        <SummaryCard title="Monthly Appointments to date" value={120} icon={<AppToDateIcon />} />
        <SummaryCard title="Appointments on time" value="75%" icon={<AppOnTimeSummaryIcon />} />
      </div>

      <div className="p-8 mb-15">
            <AppointmentsView />
          </div>
    </>

    


    
  );
}