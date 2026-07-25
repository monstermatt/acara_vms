"use client";

import { useState, useEffect, use } from "react";
import { UserData } from "@/app/volunteers/types/volunteer";
import { MessageIcon, CalendarIcon } from "@/icons";
import BookingModal from "./BookingModal";
import { EditIcon, DeleteIcon } from "@/icons";
import { useSession } from "next-auth/react";
import { set } from "date-fns";
import MessageModal from "@/app/components/MessageModal"

const trStyle = { border: "1px solid #DEDEDE", background: "#FFF" };
const tbodyStyle = { color: "#494949", fontFamily: "Quicksand", textAlign: "center" as const };

interface VolunteerTableProps {
  data: UserData[];
  onDelete: (deletedIds: number[]) => void;
  onEdit: (id: number) => void;
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

export default function VolunteerTable({ data, onDelete, onEdit }: VolunteerTableProps) {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<{ id: number; name: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<{ id: number; name: string; phone?: string } | null>(null);

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

  const openMessageModal = (volunteer: UserData) => {
    setMessageRecipient({
      id: volunteer.id,
      name: `${volunteer.user?.first_name} ${volunteer.user?.last_name}`,
      phone: volunteer.phone_number,
    });
    setIsMessageModalOpen(true);
  };

  const closeMessageModal = () => {
    setIsMessageModalOpen(false);
    setMessageRecipient(null);
  };

  const handleMessageSuccess = () => {
    console.log('Message sent successfully');
    alert("Message sent successfully");
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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all available IDs
      setSelectedRows(data.map((volunteer) => volunteer.id));
    } else {
      // Deselect all
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedRows((prev) =>
      prev.includes(id)
        ? prev.filter((rowId) => rowId !== id) // Remove if already selected
        : [...prev, id] // Add if not selected
    );
  };

  // Handle Delete API Call
  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedRows.length} volunteer(s)?`)) return;

    setIsDeleting(true);
    const token = (session as any)?.accessToken;

    try {
      // Execute DELETE requests for all selected IDs concurrently
      const deletePromises = selectedRows.map(id =>
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/volunteers/${id}/`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
      );

      const responses = await Promise.all(deletePromises);

      // Check if any failed
      const failed = responses.filter(res => !res.ok);
      if (failed.length > 0) {
        console.error("Some deletions failed");
        alert("Failed to delete some records. Please check the console.");
      }

      // Update the parent state and clear selection
      onDelete(selectedRows);
      setSelectedRows([]);

    } catch (error) {
      console.error("Error deleting volunteers:", error);
      alert("An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
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
      {/* Render the Message Modal */}
      {isMessageModalOpen && messageRecipient && (
        <MessageModal
          volunteerId={messageRecipient.id}
          volunteerName={messageRecipient.name}
          phoneNumber={messageRecipient.phone}
          onClose={closeMessageModal}
          onSuccess={handleMessageSuccess}
        />
      )}


      {/* Top Action Bar (Edit/Delete + Column Controls) */}
      <div className="flex justify-end items-center relative">

        <div className="flex items-center gap-4">
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-4 border-r pr-4 border-gray-300">

              {/*Show edit button only if exactly 1 row is selected */}
              {selectedRows.length === 1 && (
                <button
                  onClick={() => onEdit(selectedRows[0])}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                  <EditIcon />
                  Edit
                </button>
              )}
              {/* Show delete button if 1 or more rows are selected */}
              <button
                className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
                onClick={handleDeleteSelected}
                disabled={isDeleting}>
                <DeleteIcon />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <span className="text-xs text-gray-500">{selectedRows.length} selected</span>
            </div>
          )}
        </div>

        {/* Right Side: Column Toggles */}
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
              {Object.keys(columns).map((key) => {
                const colKey = key as keyof typeof columns;
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
      </div>

      {/* table */}
      <div className='table-container overflow-x-auto'>
        <table className="w-full min-w-max">
          <thead className='thead'>
            <tr>
              <th className="px-4 py-2 text-center w-12">
                <input
                  type='checkbox'
                  checked={data.length > 0 && selectedRows.length === data.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 accent-[#cd5000] cursor-pointer"
                />
              </th>


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
                  {/* Row Selection Checkbox */}
                  <td className="py-2 px-4 text-center">
                    <input
                      type='checkbox'
                      checked={selectedRows.includes(volunteer.id)}
                      onChange={() => handleSelectRow(volunteer.id)}
                      className="w-4 h-4 rounded border-gray-300 accent-[#cd5000] cursor-pointer"
                    />
                  </td>
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
                              <span className="font-semibold">{avail.dayofweek}:</span> {avail.start_time.slice(0, 5)} - {avail.end_time.slice(0, 5)}
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
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openMessageModal(volunteer)} className="flex items-center gap-2 cursor-pointer hover:text-[#9f0059] transition-colors">
                        <MessageIcon />
                        <span className="text-sm font-medium">Message</span>
                      </button>
                      <button onClick={() => openBookingModal(volunteer)} className="flex items-center gap-2 cursor-pointer hover:text-[#9F0059] transition-colors">
                        <CalendarIcon />
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