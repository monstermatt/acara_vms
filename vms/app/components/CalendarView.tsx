"use client";
import { useEffect, useMemo, useState } from "react";

import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { getEventsForDate, 
    formatTimeRange, 
    weekdays, 
    CalendarView  } from "../calendar/calendarUtils";

import { DayView } from "./DayView";
import { getVisits } from "../api/getVisits";

import { toCalendarEvent } from "../calendar/calendarManager";
import {CalendarEvent} from "../calendar/calendarUtils";


// MARK: - Visualise the calendar month view with all appointments
export default function CalendarMonthView() {
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visits, setVisits] = useState<CalendarEvent[]>([]);
  

  useEffect(() => {

    async function fetchAppointments() {
      try {
        const appointmentsData = await getVisits();
        const calendarEvents = appointmentsData.map((item) => toCalendarEvent(item));
        setVisits(calendarEvents); 
      
        // setAppointments(appointmentsData);
        console.log("Fetched appointments:", appointmentsData);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    }

    fetchAppointments();
  }, []);
  // it is important here to prevent recalculating the month grid on every time.
  const monthDays = useMemo(() => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });

    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index)).filter(
      (day) => day <= addDays(startOfWeek(monthEnd, { weekStartsOn: 1 }), 6),
    );
  }, [currentDate]);


  const selectedEvents = getEventsForDate(visits, selectedDate).sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );

  const title =
    view === "month"
      ? format(currentDate, "MMMM yyyy")
      : format(selectedDate, "EEEE, MMMM d, yyyy");

  return (
    <div className="w-full overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-50 shadow-sm">
      <div className="overflow-hidden rounded-[24px] bg-white">
        <div className="flex flex-col gap-4 border-b border-neutral-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                {format(selectedDate, "MMM")}
              </span>
              <span className="text-lg font-semibold text-neutral-900">
                {format(selectedDate, "d")}
              </span>
            </div>

            <div>
              <p className="text-xs text-neutral-400">
                {format(startOfMonth(currentDate), "MMM d, yyyy")} –{" "}
                {format(endOfMonth(currentDate), "MMM d, yyyy")}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-[#9F0059]">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-white p-1">
              <button
                onClick={() => {
                  setView("month");
                  setCurrentDate(selectedDate);
                }}
                className={`rounded-lg px-3 py-2 text-sm ${
                  view === "month" ? "bg-[#9F0059] text-white" : "text-[#9F0059]"
                }`}
              >
                Month view
              </button>
              <button
                onClick={() => setView("day")}
                className={`rounded-lg px-3 py-2 text-sm ${
                  view === "day" ? "bg-[#9F0059] text-white" : "text-[#9F0059]"
                }`}
              >
                Day view
              </button>
            </div>

            <div className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 p-1">
              <button
                onClick={() => {
                  if (view === "month") setCurrentDate(subMonths(currentDate, 1));
                  else setSelectedDate(addDays(selectedDate, -1));
                }}
                className="rounded-lg p-2 text-[#9F0059] hover:bg-pink-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(new Date());
                }}
                className="rounded-lg px-3 py-2 text-sm text-[#9F0059] hover:bg-pink-100"
              >
                Today
              </button>

              <button
                onClick={() => {
                  if (view === "month") setCurrentDate(addMonths(currentDate, 1));
                  else setSelectedDate(addDays(selectedDate, 1));
                }}
                className="rounded-lg p-2 text-[#9F0059] hover:bg-pink-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-r border-neutral-200 bg-neutral-50/70 p-4 lg:border-b-0">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">
              Agenda for {format(selectedDate, "EEEE, MMM d")}
            </h2>

            <div className="space-y-3">
              {selectedEvents.length ? (
                selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-neutral-200 bg-white p-4"
                  >
                    <div
                      className={`mb-3 inline-flex rounded-full border px-2 py-1 text-xs ${event.color}`}
                    >
                      {format(event.start, "h:mm a")}
                    </div>
                    <p className="font-semibold text-neutral-900">{event.title}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {formatTimeRange(event.start, event.end)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-500">
                  No events scheduled.
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0">
            {view === "month" ? (
              <>
                <div className="grid grid-cols-7 border-b border-neutral-200 bg-white">
                  {weekdays.map((day) => (
                    <div
                      key={day}
                      className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {monthDays.map((day, index) => {
                    const events = getEventsForDate(visits, day);
                    const muted = !isSameMonth(day, currentDate);
                    const active = isSameDay(day, selectedDate);
                    const isLastRow = index >= monthDays.length - 7;
                    const isLastColumn = index % 7 === 6;

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => {
                          setSelectedDate(day);
                          if (isSameMonth(day, currentDate)) {
                            setCurrentDate(day);
                          }
                        }}
                        className={[
                          "relative min-h-[132px] p-2 text-left align-top transition hover:bg-neutral-50",
                          !isLastRow ? "border-b border-neutral-200" : "",
                          !isLastColumn ? "border-r border-neutral-200" : "",
                        ].join(" ")}
                      >
                        <span
                          className={`absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                            isToday(day)
                              ? "bg-neutral-900 text-white"
                              : active
                                ? "bg-neutral-100 text-neutral-900"
                                : muted
                                  ? "text-neutral-300"
                                  : "text-neutral-700"
                          }`}
                        >
                          {format(day, "d")}
                        </span>

                        <div className="mt-8 space-y-1 pr-1">
                          {events.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={`truncate rounded-lg border px-2 py-1 text-[11px] ${event.color}`}
                            >
                              <span className="font-medium">{event.title}</span>
                              <span className="ml-1 opacity-80">
                                {format(event.start, "h:mm a")}
                              </span>
                            </div>
                        ))}
                        {/* If there are more than 3 events, show a "more..." indicator  otherwise it breaks the layout */}
                        {events.length > 3 ? (
                            <div className="px-1 text-[11px] text-neutral-400">
                              {events.length - 3} more...
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <DayView date={selectedDate} events={visits} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}