"use client";

import React, { useState, useEffect } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { DayOfWeek } from "../types/volunteer";

// Matches your Django DayOfWeek choices
const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export interface TimeSlot {
  dayofweek: DayOfWeek | string;
  start_time: string;
  end_time: string;
}

interface WeeklyScheduleBuilderProps {
  onScheduleChange: (schedule: TimeSlot[]) => void;
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

export default function WeeklyScheduleBuilder({ onScheduleChange }: WeeklyScheduleBuilderProps) {
  // State holds an array of numeric handles for each day. 
  // Example: [0, 6, 14, 17] means slots at 0:00-6:00 and 14:00-17:00
  const [scheduleData, setScheduleData] = useState<Record<string, number[]>>({
    MON: [0, 6],
    TUE: [0, 6, 13, 16],
    WED: [0, 6, 14, 15],
    THU: [0, 6, 14, 15],
    FRI: [0, 13],
    SAT: [0, 6, 14, 15],
    SUN: [14, 15],
  });

  // Whenever the internal slider state changes, convert it back to the flat 
  // array of objects your Django API expects and send it to the parent.
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

  // --- STYLING ---
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
      backgroundColor: "#9F0059", // Your maroon color
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
      <div className="flex justify-between text-sm font-bold text-gray-800 mb-6 border-b pb-2">
        <span className="w-24">Availabilities</span>
        <div className="flex-1 flex justify-between relative px-2">
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
            <div key={day} className="flex items-center">
              <span className="w-24 font-medium text-gray-700">
                {day === "THU" ? "Thursday" : day.charAt(0) + day.slice(1, 3).toLowerCase() + "day"}
              </span>
              
              <div className="flex-1 relative mx-4">
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

              {/* Action Buttons */}
              <div className="w-16 flex justify-end gap-2">
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