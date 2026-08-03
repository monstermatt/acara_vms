"use client";

import React, { useState, useEffect } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { DayOfWeek } from "../types/volunteer";

// Matches your Django DayOfWeek choices
const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const DAY_NAMES: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

export interface TimeSlot {
  dayofweek: DayOfWeek | string;
  start_time: string;
  end_time: string;
}

interface WeeklyScheduleBuilderProps {
  onScheduleChange: (schedule: TimeSlot[]) => void;
  initialData?: TimeSlot[]; // Optional prop to pre-populate the schedule
}

// Helper: Converts float (8.5) to Django time ("08:30:00")
const floatToTime = (val: number): string => {
  const hours = Math.floor(val);
  const minutes = Math.floor((val - hours) * 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
};

// Helper: Converts Django time ("08:30:00") to float (8.5) for the slider
const timeToFloat = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
};

export default function WeeklyScheduleBuilder({ onScheduleChange, initialData = [] }: WeeklyScheduleBuilderProps) {

  const [scheduleData, setScheduleData] = useState<Record<string, number[]>>({});
  const [hasInitialized, setHasInitialized] = useState(false);

  // Convert initial incoming data into the format the sliders need
  useEffect(() => {
    if (initialData.length > 0 && !hasInitialized) {
      const parsedData: Record<string, number[]> = {};

      initialData.forEach((slot) => {
        const day = slot.dayofweek as string;
        const startFloat = timeToFloat(slot.start_time);
        const endFloat = timeToFloat(slot.end_time);

        if (!parsedData[day]) {
          parsedData[day] = [];
        }

        parsedData[day].push(startFloat, endFloat);
        // Ensure they stay sorted from earliest to latest so the slider handles don't cross
        parsedData[day].sort((a, b) => a - b);
      });

      setScheduleData(parsedData);
      setHasInitialized(true);
    }
  }, [initialData, hasInitialized]);

  // Whenever the internal slider state changes, convert it back to the flat 
  // array of objects django API expects and send it to the parent.
  useEffect(() => {
    const apiFormattedSchedule: TimeSlot[] = [];
    Object.entries(scheduleData).forEach(([day, handles]) => {
      // Step by 2 to grab pairs (start and end)
      for (let i = 0; i < handles.length; i += 2) {
        apiFormattedSchedule.push({
          dayofweek: day,
          start_time: floatToTime(handles[i]),
          end_time: floatToTime(handles[i + 1]),
        });
      }
    });
    onScheduleChange(apiFormattedSchedule);
  }, [scheduleData, onScheduleChange]);

  const handleSliderChange = (day: string, newValues: number | number[]) => {
    if (Array.isArray(newValues)) {
      setScheduleData((prev) => ({ ...prev, [day]: newValues }));
    }
  };

  const handleMobileInputChange = (day: string, indexToUpdate: number, timeStr: string) => {
    // If the user clears the input entirely, do nothing to prevent NaN errors
    if (!timeStr) return;

    // Convert the native time string ("09:30") back into our float system (9.5)
    const newFloat = timeToFloat(timeStr);

    setScheduleData((prev) => {
      // 1. Create a fresh copy of the current day's array (React requires immutability)
      const dayValues = [...(prev[day] || [])];

      // 2. Overwrite the specific start or end time the user just changed
      dayValues[indexToUpdate] = newFloat;

      // 3. Sort the array from earliest to latest
      dayValues.sort((a, b) => a - b);

      // 4. Update the state
      return { ...prev, [day]: dayValues };
    });
  };

  const addSlot = (day: string) => {
    setScheduleData((prev) => {
      const current = prev[day] || [];
      // Don't add if already full or if the last slot ends after 20:00
      if (current.length >= 6) return prev;

      const start = current.length > 0 ? current[current.length - 1] + 1 : 8;
      const end = start + 2 > 24 ? 24 : start + 2;
      return { ...prev, [day]: [...current, start, end] };
    });
  };

  const clearDay = (day: string) => {
    setScheduleData((prev) => ({ ...prev, [day]: [] }));
  };

  // This generates the styles to make every *other* segment invisible
  const getTrackStyle = (values: number[]) => {
    return Array.from({ length: values.length - 1 }).map((_, i) => {
      if (i % 2 === 0) {
        // Active slot (e.g., between handle 0 and 1)
        return { backgroundColor: "#dca7bd", height: 16, marginTop: -6, borderRadius: 8 };
      } else {
        // Inactive space (e.g., between handle 1 and 2)
        return { backgroundColor: "transparent" };
      }
    });
  };

  const getHandleStyle = (values: number[]) => {
    return values.map(() => ({
      backgroundColor: "#9F0059",
      borderColor: "#9F0059",
      width: 20,
      height: 20,
      marginTop: -8,
      opacity: 1,
      boxShadow: "none",
    }));
  };

  return (
    <div className="w-full bg-[#f4f4f4] p-6 rounded-lg font-sans">
      <div className="w-full font-sans">
        <span className="w-24">Availabilities</span>
        <div className="hidden md:flex flex-1 justify-between relative px-2">
          <span>0:00</span>
          <span className="absolute left-1/2 -translate-x-1/2">12:00</span>
          <span>24:00</span>
        </div>
        <span className="w-16"></span> {/* Spacer for buttons */}
      </div>

      <div className="flex flex-col gap-6">
        {DAYS.map((day) => {
          const values = scheduleData[day] || [];

          return (
            <div key={day} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-0 pb-4 border-b border-gray-200 md:border-none md:pb-0">
              <span className="w-24 font-medium text-gray-700">
                {DAY_NAMES[day]}
              </span>

              <div className="flex-1 relative md:mx-4">
                {/* Desktop UI */}
                <div className="hidden md:block">
                  {/* Visual center line for 12:00 */}
                  <div className="absolute left-1/2 top-[-20px] bottom-[-20px] w-px bg-gray-300 z-0 hidden md:block"></div>

                  {values.length > 0 ? (
                    <div className="relative z-10">
                      <Slider
                        range
                        min={0}
                        max={24}
                        step={0.5} // Half hour increments
                        allowCross={false}
                        pushable={0.5} // Handles can't get closer than 30 mins
                        value={values}
                        onChange={(v) => handleSliderChange(day, v)}
                        trackStyle={getTrackStyle(values)}
                        handleStyle={getHandleStyle(values)}
                        railStyle={{ backgroundColor: "#e5e5e5", height: 4, marginTop: 0 }}
                      />

                      {/* Render the time labels under the handles */}
                      <div className="relative mt-2 text-xs text-gray-500 h-4">
                        {values.map((val, i) => {
                          const percent = (val / 24) * 100;
                          return (
                            <span
                              key={i}
                              className="absolute -translate-x-1/2"
                              style={{ left: `${percent}%` }}
                            >
                              {floatToTime(val).slice(0, 5)} {/* slice to remove seconds */}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-4 w-full bg-[#e5e5e5] rounded-full my-2 relative z-10">
                      <span className="absolute left-1/2 -translate-x-1/2 text-xs text-gray-400 mt-5">Off</span>
                    </div>
                  )}
                </div>
                {/* MOBILE UI: Stacked time pickers (Sibling to Desktop UI) */}
                <div className="flex flex-col gap-3 md:hidden py-2">
                  {values.length > 0 ? (
                    // Create an array half the length of values, so we iterate once per pair
                    Array.from({ length: values.length / 2 }).map((_, i) => {
                      const startIndex = i * 2;
                      return (
                        <div key={i} className="flex flex-wrap sm:flex-nowrap gap-2 items-center justify-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                          <input
                            type="time"
                            className="bg-transparent outline-none font-medium text-gray-700"
                            value={floatToTime(values[startIndex]).slice(0, 5)}
                            onChange={(e) => handleMobileInputChange(day, startIndex, e.target.value)}
                          />
                          <span className="text-gray-400 text-sm">to</span>
                          <input
                            type="time"
                            className="bg-transparent outline-none font-medium text-gray-700"
                            value={floatToTime(values[startIndex + 1]).slice(0, 5)}
                            onChange={(e) => handleMobileInputChange(day, startIndex + 1, e.target.value)}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-sm text-gray-400 py-2">Off</div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full md:w-16 flex justify-end gap-4 md:gap-2 mt-2 md:mt-0">
                <button type="button" onClick={() => addSlot(day)} className="text-gray-400 hover:text-[#9F0059] text-xl font-bold" title="Add Slot">
                  +
                </button>
                <button type="button" onClick={() => clearDay(day)} className="text-gray-400 hover:text-red-500 text-xl font-bold" title="Clear Day">
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}