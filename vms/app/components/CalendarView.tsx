"use client";
import { useMemo, useState } from "react";

import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  setHours,
  setMinutes,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

import { ChevronLeft, ChevronRight } from "lucide-react";

type CalendarView = "month" | "day";

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
};

const eventColors = {
  pink: "bg-[#FFF6F1] text-[#CD5000] border-[#CD5000]",
  // add more colors as needed
} as const;

// Create a calendar event with the given properties. 
function makeEvent(
  id: string,
  title: string,
  year: number,
  monthIndex: number,
  day: number,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
  color: keyof typeof eventColors,
): CalendarEvent {
  const base = new Date(year, monthIndex, day);

  return {
    id,
    title,
    start: setMinutes(setHours(base, startHour), startMinute),
    end: setMinutes(setHours(base, endHour), endMinute),
    color: eventColors[color],
  };
}

// MARK: - Replace with real data fetching from backend
const sampleEvents: CalendarEvent[] = [
  makeEvent("1", "Appointment 1", 2025, 0, 6, 9, 0, 9, 30, "pink"),
  makeEvent("2", "Appointment 2", 2025, 0, 6, 11, 0, 12, 0, "pink"),
  makeEvent("3", "Appointment 3", 2025, 0, 7, 10, 0, 10, 45, "pink"),
  makeEvent("4", "Appointment 4", 2025, 0, 7, 14, 30, 15, 0, "pink"),
  makeEvent("5", "Appointment 5", 2025, 0, 8, 9, 0, 11, 0, "pink"),
  makeEvent("6", "Appointment 6", 2025, 0, 8, 10, 30, 11, 15, "pink"),
  makeEvent("7", "Appointment 7", 2025, 0, 8, 13, 30, 14, 0, "pink"),
  makeEvent("8", "Appointment 8", 2025, 0, 9, 12, 0, 13, 0, "pink"),
  makeEvent("9", "Appointment 9", 2025, 0, 10, 9, 0, 9, 30, "pink"),
  makeEvent("10", "Appointment 10", 2025, 0, 10, 10, 0, 10, 45, "pink"),
  makeEvent("11", "Appointment 11", 2025, 0, 10, 13, 30, 14, 30, "pink"),
  makeEvent("12", "Appointment 12", 2025, 0, 11, 11, 0, 12, 0, "pink"),
  makeEvent("13", "Appointment 13", 2025, 0, 13, 12, 15, 13, 15, "pink"),
  makeEvent("14", "Appointment 14", 2025, 0, 15, 9, 30, 10, 30, "pink"),
  makeEvent("15", "Appointment 15", 2025, 0, 16, 10, 0, 10, 30, "pink"),
  makeEvent("16", "Appointment 16", 2025, 0, 16, 16, 0, 17, 0, "pink"),
  makeEvent("17", "Appointment 17", 2025, 0, 18, 7, 0, 10, 0, "pink"),
  makeEvent("18", "Appointment 18", 2025, 0, 21, 10, 30, 11, 30, "pink"),
  makeEvent("19", "Appointment 19", 2025, 0, 21, 13, 0, 14, 0, "pink"),
  makeEvent("20", "Appointment 20", 2025, 0, 21, 19, 0, 20, 30, "pink"),
  makeEvent("21", "Appointment 21", 2025, 0, 22, 9, 0, 11, 0, "pink"),
  makeEvent("22", "Appointment 22", 2025, 0, 22, 14, 30, 15, 15, "pink"),
  makeEvent("23", "Appointment 23", 2025, 0, 23, 10, 0, 10, 45, "pink"),
  makeEvent("24", "Appointment 24", 2025, 0, 24, 13, 45, 14, 30, "pink"),
  makeEvent("25", "Appointment 25", 2025, 0, 24, 14, 30, 15, 30, "pink"),
  makeEvent("26", "Appointment 26", 2025, 0, 28, 11, 0, 12, 0, "pink"),
  makeEvent("27", "Appointment 27", 2025, 0, 28, 12, 45, 13, 30, "pink"),
  makeEvent("28", "Appointment 28", 2025, 0, 29, 9, 30, 10, 30, "pink"),
  makeEvent("29", "Appointment 29", 2025, 0, 30, 16, 0, 17, 0, "pink"),
  makeEvent("30", "Appointment 30", 2025, 0, 30, 17, 30, 19, 0, "pink"),
  makeEvent("31", "Appointment 31", 2025, 0, 31, 9, 0, 9, 30, "pink"),
  makeEvent("32", "Appointment 32", 2025, 0, 10, 10, 0, 11, 30, "pink"),
  makeEvent("33", "Appointment 33", 2025, 0, 10, 10, 30, 11, 15, "pink"),
];

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 80;
const DAY_VIEW_HEIGHT = 720;
const FULL_DAY_HEIGHT = hours.length * HOUR_HEIGHT;

// Formats a time range in a user-friendly way.
function formatTimeRange(start: Date, end: Date) {
  return `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
}

// Retrieves events for a specific date by filtering the list of all events and checking if their start time falls on the given date.
function getEventsForDate(events: CalendarEvent[], date: Date) {
  return events.filter((event) => isSameDay(event.start, date));
}


// MARK: - Visualise the appintments for a single day.
function DayView({ date, events }: { date: Date; events: CalendarEvent[] }) {
  const dayEvents = getEventsForDate(events, date).sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );

  // useMemo is a React Hook that lets you cache the result of a calculation between re-renders.
  const laidOutEvents = useMemo(() => {
    type PositionedEvent = CalendarEvent & {
      column: number;
      columnsInGroup: number;
    };

    const groups: CalendarEvent[][] = [];
    let currentGroup: CalendarEvent[] = [];
    let currentGroupEnd = -1;

    for (const event of dayEvents) {
      const eventStart = event.start.getHours() * 60 + event.start.getMinutes();
      const eventEnd = event.end.getHours() * 60 + event.end.getMinutes();

      if (currentGroup.length === 0 || eventStart < currentGroupEnd) {
        currentGroup.push(event);
        currentGroupEnd = Math.max(currentGroupEnd, eventEnd);
      } else {
        groups.push(currentGroup);
        currentGroup = [event];
        currentGroupEnd = eventEnd;
      }
    }

    if (currentGroup.length) groups.push(currentGroup);

    const positioned: PositionedEvent[] = [];

    for (const group of groups) {
      const columnEnds: number[] = [];
      const temp: Array<{ event: CalendarEvent; column: number }> = [];

      for (const event of group) {
        const eventStart = event.start.getHours() * 60 + event.start.getMinutes();
        const eventEnd = event.end.getHours() * 60 + event.end.getMinutes();

        let assignedColumn = -1;

        for (let i = 0; i < columnEnds.length; i += 1) {
          if (eventStart >= columnEnds[i]) {
            assignedColumn = i;
            columnEnds[i] = eventEnd;
            break;
          }
        }

        if (assignedColumn === -1) {
          assignedColumn = columnEnds.length;
          columnEnds.push(eventEnd);
        }

        temp.push({ event, column: assignedColumn });
      }

      const columnsInGroup = columnEnds.length;

      for (const item of temp) {
        positioned.push({
          ...item.event,
          column: item.column,
          columnsInGroup,
        });
      }
    }

    return positioned;
  }, [dayEvents]);

  return (
    <div className="h-[720px] overflow-y-auto">
      <div className="grid grid-cols-[72px_1fr]" style={{ height: FULL_DAY_HEIGHT }}>
        <div className="border-r border-neutral-200 bg-white">
          {hours.map((hour) => (
            <div
              key={hour}
              className="relative border-b border-neutral-100 pr-3 pt-2 text-right text-xs text-neutral-400"
              style={{ height: HOUR_HEIGHT }}
            >
              {format(setMinutes(setHours(date, hour), 0), "h a")}
            </div>
          ))}
        </div>

        <div className="relative bg-white">
          {hours.map((hour) => (
            <div
              key={hour}
              className="border-b border-neutral-100"
              style={{ height: HOUR_HEIGHT }}
            />
          ))}

          <div className="pointer-events-none absolute inset-0">
            {laidOutEvents.map((event) => {
              const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
              const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
              const top = (startMinutes / 60) * HOUR_HEIGHT;
              const height = Math.max(
                ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT,
                34,
              );
              const gap = 6;
              const width = `calc(${100 / event.columnsInGroup}% - ${(gap * (event.columnsInGroup - 1)) / event.columnsInGroup}px)`;
              const left = `calc(${(100 / event.columnsInGroup) * event.column}% + ${gap * event.column}px)`;

              return (
                <div
                  key={event.id}
                  className={`pointer-events-auto absolute overflow-hidden rounded-xl border px-3 py-2 shadow-sm ${event.color}`}
                  style={{ top, height, width, left }}
                >
                  <p className="truncate text-sm font-semibold">{event.title}</p>
                  <p className="truncate text-xs opacity-80">
                    {formatTimeRange(event.start, event.end)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


// MARK: - Visualise the calendar month view with all appointments
export default function CalendarMonthView() {
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 10));
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 0, 10));

  // useMemo is a React Hook that lets you cache the result of a calculation between re-renders.
  // it is important here to prevent recalculating the month grid on every time.
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });

    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index)).filter(
      (day) => day <= addDays(startOfWeek(monthEnd, { weekStartsOn: 1 }), 6),
    );
  }, [currentDate]);


  const selectedEvents = getEventsForDate(sampleEvents, selectedDate).sort(
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
                  setCurrentDate(new Date(2025, 0, 10));
                  setSelectedDate(new Date(2025, 0, 10));
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
                    const events = getEventsForDate(sampleEvents, day);
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
              <DayView date={selectedDate} events={sampleEvents} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}