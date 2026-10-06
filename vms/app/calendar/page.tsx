'use client';
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar, CalendarEvent, toCalendarEvent, shiftToCalendarEvent } from "../components/Calendar";
import { getVisits } from "../api/getVisits";
import { getOpportunityShifts } from "../api/getOpportunityShifts";
import OpportunityModal from "./components/OpportunityModal";
import OpportunityDetailsModal from "./components/OpportunityDetailsModal";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken;
  const role = (session as any)?.user?.role;
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShiftEvent, setSelectedShiftEvent] = useState<CalendarEvent | null>(null);

  const fetchAppointments = async () => {
    if (status !== "authenticated" || !token) return;
    try {
        const [appointmentsData, shiftsData] = await Promise.all([
          getVisits(token),
          getOpportunityShifts(token)
        ]);
        
        const visitEvents = appointmentsData.map(toCalendarEvent);
        const shiftEvents = shiftsData.map(shiftToCalendarEvent);
        
        setEvents([...visitEvents, ...shiftEvents]);
      } catch (error) {
        console.error("Error fetching appointments or shifts:", error);
      }
  };

  useEffect(() => {
    fetchAppointments();
  }, [token, status]);

  const handleEventClick = (event: CalendarEvent) => {
    if (event.kind === "opportunity") {
      setSelectedShiftEvent(event);
    }
  };

  return (
    <>
    <div className="p-8 flex justify-between items-start">
      <div>
        <h1 className="text-2xl font-bold text-[#9f0059] mb-4">Calendar</h1>
        <p className="text-gray-600"> Here an overview of your visits </p>
      </div>
      {['COORD', 'ADMIN'].includes(role) && (
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="bg-[#9F0059] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-[#7a0045] transition-colors"
        >
          Create Opportunity
        </button>
      )}
    </div>

    <div className="px-8 pb-10 bg-white">
      <main className="w-full">
        <Calendar events={events} onEventClick={handleEventClick} />
      </main>
    </div>
    
    {showCreateModal && (
      <OpportunityModal 
        onClose={() => setShowCreateModal(false)} 
        onSuccess={() => { setShowCreateModal(false); fetchAppointments(); }} 
      />
    )}
    
    {selectedShiftEvent && (
      <OpportunityDetailsModal 
        shift={selectedShiftEvent.meta} 
        onClose={() => setSelectedShiftEvent(null)} 
        onSuccess={() => { setSelectedShiftEvent(null); fetchAppointments(); }} 
      />
    )}
    </>
  );
}