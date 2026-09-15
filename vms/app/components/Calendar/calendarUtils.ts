import {
  format,
  isSameDay,
  setHours,
  setMinutes,
} from "date-fns";

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
};

export const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const hours = Array.from({ length: 24 }, (_, i) => i);
export const HOUR_HEIGHT = 80;
export const DAY_VIEW_HEIGHT = 720;
export const FULL_DAY_HEIGHT = hours.length * HOUR_HEIGHT;

// Retrieves events for a specific date by filtering the list of all events and checking if their start time falls on the given date.
export const getEventsForDate = (events: CalendarEvent[], date: Date) => {
  return events.filter((event) => isSameDay(event.start, date));
}

export const formatTimeRange = (start: Date, end: Date) => {
  return `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
}

export const eventColors = {
  pink: "bg-[#FFF6F1] text-[#CD5000] border-[#CD5000]",
  // add more colors if needed
} as const;

// Create a calendar event with the given properties. 
export const makeEvent = (
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
): CalendarEvent => {
  const base = new Date(year, monthIndex, day);

  return {
    id,
    title,
    start: setMinutes(setHours(base, startHour), startMinute),
    end: setMinutes(setHours(base, endHour), endMinute),
    color: eventColors[color],
  };
}

export type CalendarView = "month" | "day";
