import { AppOnTimeSummaryIcon } from "@/icons";
import SummaryCard from "../components/SummaryCard";

// import {CalendarSummaryIcon, AppOnTimeSummaryIcon, AppOnTimeSummaryIcon} from '@/icons'

export default function DashboardPage() {
  return (
    <>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#9f0059] mb-4">Dashboard</h1>
        <p className="text-gray-600">Coming soon</p>
      </div>

      <div className = 'flex gap-4 px-8'>
        {/* <SummaryCard title="Appointments this month" value={480} icon={<CalendarSummaryIcon />} /> */}
        {/*<SummaryCard title="Charted Late" value={120} icon={<AppOnTimeSummaryIcon />} /> */}
        {/* <SummaryCard title="Appointments on time (%)" value="75%" icon={<AppOnTimeSummaryIcon />} /> */}
      </div>
    </>
    
  );
}