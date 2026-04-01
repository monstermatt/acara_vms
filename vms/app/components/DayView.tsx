"use client";
import { useMemo } from "react";

import {
  format,
  setHours,
  setMinutes
} from "date-fns";

import { getEventsForDate, 
    formatTimeRange, 
    CalendarEvent, 
    eventColors, 
    weekdays, 
    hours,
    HOUR_HEIGHT,
    FULL_DAY_HEIGHT, makeEvent  } from "../calendar/calendarUtils";


export const DayView = ({ date, events }: { date: Date; events: CalendarEvent[] }) => {
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