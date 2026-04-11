"use client";

import { useState, useEffect, use } from "react";
import { UserData } from "@/app/volunteers/types/volunteer";
import { MessageIcon, CalendarIcon } from "@/icons";
import BookingModal from "./BookingModal";
import { User } from "next-auth";
import { set } from "date-fns";

const trStyle = { border: "1px solid #DEDEDE", background: "#FFF" };
const tbodyStyle = { color: "#494949", fontFamily: "Quicksand", textAlign: "center" as const };

interface VolunteerTableProps {
  data: UserData[];
}
//default columns
const DEFAULT_COLUMNS = {
  phone: true,
  gender: false,
  skills: true,
  schedule: true,
  languages: false,
  sub: false,
  preferences: true,
  distance: false,
  team: false,
};

export default function VolunteerTable({ data }: VolunteerTableProps) {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<{ id: number; name: string } | null>(null);

  //boooking modal handlers
  const openBookingModal = (volunteer: UserData) => {
    setSelectedVolunteer({
      id: volunteer.id,
      name: `${volunteer.user?.first_name} ${volunteer.user?.last_name}`,
    });
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedVolunteer(null);
  };

  const handleBookingSuccess = () => {
    console.log('Booking successful');
  };

  //Check if they have saved preferences from a previous visit
  useEffect(() => {
    setIsMounted(true);
    const savedColumns = localStorage.getItem("volunteerTablePreferences");
    
    if (savedColumns) {
      try {
        setColumns(JSON.parse(savedColumns));
      } catch (error) {
        console.error("Could not load saved table preferences", error);
      }
    }
  }, []);

  //Save the preferences back to localStorage whenever they click a checkbox
  useEffect(() => {
    // Only save after the initial mount to prevent overwriting saved data with defaults
    if (isMounted) {
      localStorage.setItem("volunteerTablePreferences", JSON.stringify(columns));
    }
  }, [columns, isMounted]);

  // This prevents the table from "flickering" from default columns to saved columns.
  if (!isMounted) {
    return <div className="p-8 text-center text-gray-400 font-medium">Loading table preferences...</div>;
  }

  // Helper to toggle specific columns
  const toggleColumn = (colName: keyof typeof columns) => {
    setColumns((prev) => ({
      ...prev,
      [colName]: !prev[colName],
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Render the Booking Modal */}
      {isBookingModalOpen && selectedVolunteer && (
        <BookingModal
          volunteerId={selectedVolunteer.id}
          volunteerName={selectedVolunteer.name}
          onClose={closeBookingModal}
          onSuccess={handleBookingSuccess}
        />
      )}
      
      {/*  Column Visibility Controls  */}
      <div className="flex justify-end relative">
        <button
          onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <span>Display Columns</span>
          <span className="text-xs">▼</span>
        </button>

        {isColumnMenuOpen && (
          <div className="absolute top-12 right-0 z-20 w-48 bg-white border border-gray-200 rounded-md shadow-lg p-3 flex flex-col gap-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Toggle Columns</h4>
            
            {/* Map through state to create checkboxes */}
            {Object.keys(columns).map((key) => {
              const colKey = key as keyof typeof columns;
              // Format the key for the label (e.g., 'sub' -> 'Sub', 'distance' -> 'Distance')
              const label = colKey.charAt(0).toUpperCase() + colKey.slice(1).replace(/([A-Z])/g, ' $1');
              
              return (
                <label key={colKey} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={columns[colKey]}
                    onChange={() => toggleColumn(colKey)}
                    className="w-4 h-4 text-[#9F0059] rounded border-gray-300 focus:ring-[#9F0059]"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* table */}
      <div className='table-container overflow-x-auto'>
        <table className="w-full min-w-max">
          <thead className='thead'>
            <tr>
              {/* Name is always visible */}
              <th>Name</th>
              
              {/* Conditionally rendered headers */}
              {columns.phone && <th>Phone Number</th>}
              {columns.gender && <th>Gender</th>}
              {columns.skills && <th>Skills</th>}
              {columns.schedule && <th>Schedule</th>}
              {columns.languages && <th>Languages</th>}
              {columns.sub && <th>Sub?</th>}
              {columns.preferences && <th>Preferences</th>}
              {columns.distance && <th>Travel Distance</th>}
              {columns.team && <th>Team</th>}
              
              {/* Actions are always visible */}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody style={tbodyStyle}>
            {data.length > 0 ? (
              data.map((volunteer) => (
                <tr key={volunteer.id} style={trStyle}>
                  {/* Name (Always Visible) */}
                  <td className="py-2 px-4 font-medium text-gray-900">
                    {volunteer.user?.first_name} {volunteer.user?.last_name}
                  </td>
                  
                  {/* Conditionally rendered cells */}
                  {columns.phone && <td className="py-2 px-4">{volunteer.phone_number}</td>}
                  {columns.gender && <td className="py-2 px-4">{volunteer.gender}</td>}
                  
                  {columns.skills && (
                    <td className="py-2 px-4">
                      {volunteer.skills?.map((skill, index) => (
                        <span key={index}>{skill.skill_name}{index < volunteer.skills.length - 1 ? ", " : ""} </span>
                      ))}
                    </td>
                  )}
                  
                  {columns.schedule && (
                    <td className="py-2 px-4">
                      {volunteer.availability && volunteer.availability.length > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          {volunteer.availability.map((avail, index) => (
                            <span key={avail.id || index} className="text-xs bg-gray-100 px-2 py-1 rounded w-max">
                              <span className="font-semibold">{avail.dayofweek}:</span> {avail.start_time.slice(0,5)} - {avail.end_time.slice(0,5)}
                            </span>
                          ))}
                        </div>
                      ) : ( 
                        <span className="text-gray-400 italic text-sm">None</span> 
                      )} 
                    </td>
                  )}

                  {columns.languages && (
                    <td className="py-2 px-4">{volunteer.languages?.map(lang => lang.language_name).join(", ")}</td>
                  )}
                  
                  {columns.sub && (
                    <td className="py-2 px-4">{volunteer.sub_duty_preference ? "Yes" : "No"}</td>
                  )}
                  
                  {columns.preferences && (
                    <td className="py-2 px-4">
                      {volunteer.preferences?.map((pref, index) => (
                        <span key={index}>{pref.preference}{index < volunteer.preferences.length - 1 ? ", " : ""} </span>
                      ))}
                    </td>
                  )}
                  
                  {columns.distance && (
                    <td className="py-2 px-4">{volunteer.max_distance_preferred ? `${volunteer.max_distance_preferred} mi` : "N/A"}</td>
                  )}

                  {columns.team && <td className="py-2 px-4">{volunteer.team}</td>}


                  {/* Actions (Always Visible) */}
                  <td className="py-2 px-4">
                    <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-[#9F0059] transition-colors">
                      <MessageIcon />
                      <span className="text-sm font-medium">Message</span>
                      <button onClick = {() => openBookingModal(volunteer)} className ="flex items-center gap-2">
                        <CalendarIcon/>
                        <span className="text-sm font-medium">Book</span>
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="py-8 text-gray-500">
                  No volunteers found matching the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}