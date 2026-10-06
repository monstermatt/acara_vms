import { useState } from 'react';
import { useSession } from "next-auth/react";
import { CalendarIcon, ClockIcon, ReportingIcon } from '@/icons';

interface OpportunityModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const FREQUENCY_OPTIONS = [
    { label: 'One time', value: 'NONE' },
    { label: 'Weekly', value: 'WEEKLY' },
    { label: 'Every 2 weeks', value: 'BIWEEKLY' },
];

const DAYS_OF_WEEK = [
    { label: 'Monday', value: 'MON' },
    { label: 'Tuesday', value: 'TUE' },
    { label: 'Wednesday', value: 'WED' },
    { label: 'Thursday', value: 'THU' },
    { label: 'Friday', value: 'FRI' },
    { label: 'Saturday', value: 'SAT' },
    { label: 'Sunday', value: 'SUN' },
];

export default function OpportunityModal({ onClose, onSuccess }: OpportunityModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [recurrence, setRecurrence] = useState('NONE');
    const [dayofweek, setDayOfWeek] = useState('MON');
    const [volunteersNeeded, setVolunteersNeeded] = useState(1);
    
    const [error, setError] = useState('');
    const { data: session } = useSession();
    const token = (session as any)?.accessToken;
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');

        if (!title || !startDate || !startTime || !endTime) {
            setError('Please fill in all required fields.');
            return;
        }

        let finalEndDate = endDate || startDate;
        let finalDayOfWeek = dayofweek;
        if (recurrence === 'NONE') {
            finalEndDate = startDate;
            finalDayOfWeek = '';
        } else if (!endDate) {
            setError('Please specify an end date for recurring opportunities.');
            return;
        }

        const data = {
            title,
            description,
            start_date: startDate,
            end_date: finalEndDate,
            start_time: startTime + ':00',
            end_time: endTime + ':00',
            recurrence,
            dayofweek: finalDayOfWeek,
            volunteers_needed: volunteersNeeded
        };

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/opportunities/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                onSuccess();
                setIsSuccess(true);
            } else {
                const errorData = await response.json();
                setError(errorData.non_field_errors?.join(' ') || 'Error creating opportunity. Please try again.');
            }
        } catch (err) {
            console.error('Error creating opportunity:', err);
            setError('A network error occurred.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            {isSuccess ? (
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-12 flex flex-col items-center relative transition-all duration-300 transform scale-100">
                    <h2 className="text-4xl font-bold text-primary mb-3 text-center">Opportunity Created</h2>
                    <p className="text-gray-500 mb-8 text-center text-lg">Your new volunteering opportunity is now live.</p>
                    <button type="button" onClick={onClose} className="btn-primary px-16 text-lg shadow-md">
                        Close
                    </button>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
                    <h2 className="text-4xl font-bold text-primary mb-2">Create Opportunity</h2>
                    <p className="text-gray-500 mb-8 text-lg">Define a new opening for volunteers.</p>

                    {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Title *</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-style w-full" placeholder="e.g. Sunday Greeter" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Volunteers Needed</label>
                                <input type="number" min="1" value={volunteersNeeded} onChange={(e) => setVolunteersNeeded(parseInt(e.target.value) || 1)} className="input-style w-full" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-style w-full min-h-[100px]" placeholder="Duties, requirements, etc." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Start Date *</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-style w-full" required />
                            </div>
                            {recurrence !== 'NONE' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">End Date *</label>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-style w-full" required={recurrence !== 'NONE'} />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Start Time *</label>
                                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-style w-full" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">End Time *</label>
                                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-style w-full" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Recurrence</label>
                                <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="input-style w-full">
                                    {FREQUENCY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            {recurrence !== 'NONE' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Day of Week</label>
                                    <select value={dayofweek} onChange={(e) => setDayOfWeek(e.target.value)} className="input-style w-full">
                                        {DAYS_OF_WEEK.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-4 mt-4">
                            <button type="button" onClick={onClose} className="btn-outline px-8 py-2 font-bold">Cancel</button>
                            <button type="submit" className="btn-primary px-8 py-2">Create Opportunity</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
