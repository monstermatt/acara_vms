import SummaryCard from "../../components/SummaryCard";

import {CalendarSummaryIcon, ChartLateSummaryIcon, AppOnTimeSummaryIcon} from '@/icons'


export default function VolunteerReportingPage() {
  return (
    <main className = "main-container">
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#9f0059] mb-4">Reporting</h1>
      <p className="text-gray-600">Here are today’s volunteer meetings and audits</p>
    </div>

    <div className = 'flex gap-4 px-8'>
      <SummaryCard title="Appointments this month" value={480} icon={<CalendarSummaryIcon />} />
      <SummaryCard title="Charted Late" value={120} icon={<ChartLateSummaryIcon />} />
      <SummaryCard title="Appointments on time (%)" value="75%" icon={<AppOnTimeSummaryIcon />} />
    </div>

    

    {/* Wait for Esra code to align the UI */}
    <div className = 'table-container'>
      <h1 className = 'text-black text-xl'>Volunteer Audits</h1>
      <table>
        <thead className = 'thead'>
          <tr>
            <th>Volunteer Name</th>
            <th>Appointment Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody className = 'text-[#494949]'>
          <tr  className = 'border-1 border-[#DEDEDE]'>
            <td>John Doe</td>
            <td>2024-06-01</td>
            <td>On Time</td>
          </tr>
          <tr>
            <td>Jane Smith</td>
            <td>2024-06-02</td>
            <td>Late</td>
          </tr>
          {/* More rows as needed */}
        </tbody>
      </table>
    </div>

    </main>
  );
}