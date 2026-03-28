import AppointmentsCard from "../components/SummaryCard";

export default function DashboardPage() {
  return (
    <>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#9f0059] mb-4">Dashboard</h1>
        <p className="text-gray-600">Coming soon</p>
      </div>

      <div className = 'flex gap-4 px-8'>
        <AppointmentsCard title="Today's appointments" value={480} iconSrc="/calendar_icon.svg" />
        <AppointmentsCard title="Monthly appointment to date" value={120} iconSrc="/app_to_date_icon.svg" />
        <AppointmentsCard title="Appointments on time (%)" value="75%" iconSrc="/app_on_time_icon.svg" />
      </div>
    </>
    
  );
}