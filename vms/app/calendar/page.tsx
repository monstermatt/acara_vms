import MonthCalendar from "../components/CalendarView";

export default function CalendarPage() {
  return (

    <>
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#9f0059] mb-4">Calendar</h1>
      <p className="text-gray-600">Coming soon</p>
    </div>

    <div className="px-8 pb-10 bg-white">
      <main className="w-full">
        <MonthCalendar />
      </main>
    </div>
    </>
  );
}