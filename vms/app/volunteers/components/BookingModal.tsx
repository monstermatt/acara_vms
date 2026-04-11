import { useState } from 'react';
import { useSession } from "next-auth/react";
import { CalendarIcon, ClockIcon, ReportingIcon } from '@/icons';


interface BookingModalProps {
  volunteerId: number;
  volunteerName: string;
  onClose: () => void;
  onSuccess: () => void; // Callback to refresh table or show success message
}

// Frequency options
const FREQUENCY_OPTIONS = [
    { label: 'One time', value: 'NONE' },
    { label: 'Every Monday', value: 'MON' },
    { label: 'Every Tuesday', value: 'TUE' },
    { label: 'Every Wednesday', value: 'WED' },
    { label: 'Every Thursday', value: 'THU' },
    { label: 'Every Friday', value: 'FRI' },
    { label: 'Every Saturday', value: 'SAT' },
    { label: 'Every Sunday', value: 'SUN' },
    ];

export default function BookingModal({ volunteerId, volunteerName, onClose, onSuccess }: BookingModalProps) {
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('21:00');
    const [frequency, setFrequency] = useState('NONE');
    const [error, setError] = useState('');
    const { data: session } = useSession();
    const token = (session as any)?.accessToken;
    const [isSuccess, setIsSuccess] = useState(false);



  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    // Input validation
    if (!startDate || !startTime || !endTime || !frequency) {
      setError('Please fill in all fields.');
      return;
    }
    //Determine the actual day of the week if "One time" is selected
    let finalDayOfWeek = frequency;
    if (frequency === 'NONE') {
      // Split the date string to avoid timezones messing with the day calculation
      const [year, month, day] = startDate.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      finalDayOfWeek = days[dateObj.getDay()];
    }

    const bookingData = {
      volunteer: volunteerId,
      start_date: startDate,
      end_date: startDate, // Assuming a single occurrence for this example
      dayofweek: finalDayOfWeek, //will always send 3 letter code of day, backend will handle "NONE" case by using start_date to determine day of week
      start_time: startTime + ':00', // Backend needs time in HH:MM:SS format
      end_time: endTime + ':00',
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/schedules/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        // Success: call callback, clear form, close modal, and show confirmation
        onSuccess();
        setIsSuccess(true);
        setStartDate('');
        setStartTime('10:00');
        setEndTime('14:00');
        setFrequency('NONE');
        //onClose();
      } else {
        // Error from backend
        const errorData = await response.json();
        setError(errorData.non_field_errors?.join(' ') || 'Error creating booking. Please try again.');
      }
    } catch (err) {
      // General fetch error
      console.error('Error creating booking:', err);
      setError('A network error occurred.');
    }
  };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      
            {isSuccess ? (
                // SUCCESS SCREEN
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-12 flex flex-col items-center relative transition-all duration-300 transform scale-100">
                <h2 className="text-4xl font-bold text-[#9F0059] mb-3 text-center">Appointment Confirmed</h2>
                <p className="text-gray-500 mb-8 text-center text-lg">Congratulations, you booked an appointment with:</p>
                
                <div className="w-40 h-40 rounded-full bg-gray-200 mb-4 overflow-hidden shadow-md border-4 border-white outline outline-1 outline-gray-200">
                    <img src={`https://ui-avatars.com/api/?name=${volunteerName}&background=random&size=200`} alt={volunteerName} className="object-cover w-full h-full" />
                </div>
                <h3 className="text-xl font-bold text-[#9F0059] text-center mb-10">{volunteerName}</h3>
                
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="bg-[#9F0059] text-white px-16 py-3 rounded-full font-bold hover:bg-[#7a0044] transition-colors text-lg shadow-md"
                >
                    Close
                </button>
                </div>
            ) : (
                // BOOKING FORM
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        
                {/* Modal Content Container */}
                <div className="bg-white p-8 rounded-3xl max-w-3xl relative">
                
                    {/* Header */}
                    <h2 className="text-4xl font-bold text-[#9F0059] mb-2">Book appointment</h2>
                    <p className="text-gray-500 mb-10 text-lg">Fill in the form to book an appointment with:</p>

                    {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

                    <div className="flex flex-col md:flex-row gap-12">
            
                        {/* Left Column: Avatar & Name */}
                        <div className="flex flex-col items-center pt-4 md:w-1/3">
                            <div className="w-40 h-40 rounded-full bg-gray-200 mb-6 overflow-hidden shadow-md border-4 border-white outline outline-1 outline-gray-200">
                                {/* Replace with actual volunteer image if available */}
                                <img src={`https://ui-avatars.com/api/?name=${volunteerName}&background=random&size=200`} alt={volunteerName} className="object-cover w-full h-full" />
                            </div>
                            <h3 className="text-xl font-bold text-[#9F0059] text-center">{volunteerName}</h3>
                        </div>

                        {/* Right Column: Form Container */}
                        <div className="md:w-2/3">
                            <form onSubmit={handleSubmit}>
                
                            {/* Boxed Form Area */}
                                <div className="border border-gray-400 rounded-2xl p-8 mb-8 flex flex-col gap-6">
                    
                                    {/* Date Row */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-32 font-bold text-gray-800 flex items-center gap-2">
                                            <span className="text-xl"><CalendarIcon /></span> Date
                                        </div>
                                        <input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="input-style flex-1 bg-white" 
                                        />
                                    </div>

                                    {/* Time Row */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-32 font-bold text-gray-800 flex items-center gap-2">
                                            <span className="text-xl"><ClockIcon /></span> Time
                                        </div>
                                        <div className="flex-1 flex gap-4">
                                            <input 
                                            type="time" 
                                            value={startTime} 
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="input-style w-1/2 bg-white" 
                                            />
                                            <input 
                                            type="time" 
                                            value={endTime} 
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="input-style w-1/2 bg-white" 
                                            />
                                        </div>
                                    </div>

                                    {/* Frequency Row */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-32 font-bold text-gray-800 flex items-center gap-2">
                                            <span className="text-xl"><ReportingIcon /></span> Frequency
                                        </div>
                                        <select 
                                            value={frequency} 
                                            onChange={(e) => setFrequency(e.target.value)}
                                            className=" input-style flex-1 bg-white"
                                        >
                                            {FREQUENCY_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                        {/* Status Indicator */}
                                        {/* will implement later if there is time */}
                                        {/* <div className="flex items-center gap-2 ml-[9.5rem]">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span className="text-green-600 font-medium text-sm">Available</span>
                                        </div> */}
                                </div>
                
                                {/* Action Buttons */}
                                <div className="flex gap-4">
                                    <button 
                                    type="submit" 
                                    className="bg-[#9F0059] text-white px-10 py-3 rounded-full font-bold hover:bg-[#7a0044] transition-colors w-40"
                                    >
                                    Book
                                    </button>
                                    <button 
                                    type="button" 
                                    onClick={onClose} 
                                    className="bg-white text-[#9F0059] border border-[#9F0059] px-10 py-3 rounded-full font-bold hover:bg-pink-50 transition-colors w-40"
                                    >
                                    Cancel
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>

                </div>
            </div>)}
        </div>
  );
}