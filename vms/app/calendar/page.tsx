'use client';
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar, CalendarEvent, toCalendarEvent } from "../components/Calendar";
import { getVisits } from "../api/getVisits";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken;

  useEffect(() => {
    if (status !== "authenticated" || !token) return;

    async function fetchAppointments() {
      try {
        const appointmentsData = await getVisits(token);
        setEvents(appointmentsData.map(toCalendarEvent));
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    }

    fetchAppointments();
  }, [token, status]);

  return (
    <>
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#9f0059] mb-4">Calendar</h1>
      <p className="text-gray-600"> Here an overview of your visits </p>
    </div>

    <div className="px-8 pb-10 bg-white">
      <main className="w-full">
        <Calendar events={events} />
      </main>
    </div>
    </>
  );
}