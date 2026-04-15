// MARK: - Here is where we dynamically request the events via API
import {CalendarEvent} from "./calendarUtils"
import { makeEvent } from "./calendarUtils";


export function toCalendarEvent(item: any): CalendarEvent {
  const [year, month, day] = item.visit_date.split("-").map(Number);
  const [startHour, startMinute] = item.visit_start_time.split(":").map(Number);
  const [endHour, endMinute] = item.visit_end_time.split(":").map(Number);

  return makeEvent(
    String(item.id),
    `Visit ${item.id}`, // customize if needed
    year,
    month - 1, // JS months are 0-based
    day,
    startHour,
    startMinute,
    endHour,
    endMinute,
    "pink"
  );
}

