import { useState } from 'react';
import { useSession } from "next-auth/react";
import { format } from "date-fns";

interface OpportunityDetailsModalProps {
    shift: any; // The item from shiftToCalendarEvent (which is item)
    onClose: () => void;
    onSuccess: () => void; // Trigger refresh
}

export default function OpportunityDetailsModal({ shift, onClose, onSuccess }: OpportunityDetailsModalProps) {
    const { data: session } = useSession();
    const token = (session as any)?.accessToken;
    const role = (session as any)?.user?.role;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isVolunteer = role === 'VOLUN';
    const hasSignedUp = !!shift.my_signup_id;
    const isFull = shift.is_full;

    const handleAction = async (action: 'accept' | 'withdraw') => {
        setLoading(true);
        setError('');

        try {
            const endpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/opportunity-shifts/${shift.id}/${action}/`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: '' }), // optional reason
            });

            if (response.ok) {
                onSuccess();
            } else {
                const data = await response.json();
                setError(data.error || `Failed to ${action}.`);
            }
        } catch (err) {
            setError('A network error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveVolunteer = async (signupId: number) => {
        if (!confirm("Are you sure you want to remove this volunteer?")) return;
        setLoading(true);
        setError('');

        try {
            const endpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/opportunity-signups/${signupId}/remove/`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: 'Removed by coordinator' }),
            });

            if (response.ok) {
                onSuccess();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to remove volunteer.');
            }
        } catch (err) {
            setError('A network error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white p-8 rounded-3xl max-w-lg w-full relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-gray-800">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <h2 className="text-3xl font-bold text-[#9F0059] mb-2">{shift.opportunity.title}</h2>

                <div className="flex gap-2 items-center mb-6">
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                        {shift.shift_date}
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                        {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                    </span>
                </div>

                {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-md text-sm">{error}</div>}

                {shift.opportunity.recurrence && shift.opportunity.recurrence !== 'NONE' && (
                    <p className="text-sm text-gray-600 mb-4 italic bg-yellow-50 p-3 rounded-md">
                        You're signing up for {shift.shift_date} only.
                    </p>
                )}

                {isVolunteer && hasSignedUp && (
                    <div className="bg-green-50 p-3 rounded-md mb-4 border border-green-200">
                        <span className="text-green-800 font-bold text-sm">✅ You're signed up</span>
                    </div>
                )}

                <div className="mb-6 space-y-4">
                    <div>
                        <h4 className="font-bold text-gray-700">Description</h4>
                        <p className="text-gray-600 text-sm mt-1">{shift.opportunity.description || 'No description provided.'}</p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="block text-sm text-blue-800 font-bold">Capacity</span>
                            <span className="text-blue-600 text-sm">{shift.filled_count} of {shift.volunteers_needed} filled</span>
                        </div>
                        {isFull && !hasSignedUp && (
                            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded">FULL</span>
                        )}
                    </div>
                </div>

                {['COORD', 'ADMIN'].includes(role) && shift.signups && (
                    <div className="mb-6">
                        <h4 className="font-bold text-gray-700 mb-2">Signed-up Volunteers</h4>
                        {shift.signups.length === 0 ? (
                            <p className="text-gray-700 text-sm">No volunteers have signed up yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {shift.signups.map((signup: any) => (
                                    <li key={signup.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                        <span className="text-sm text-gray-700 font-medium">{signup.name}</span>
                                        <button
                                            onClick={() => handleRemoveVolunteer(signup.id)}
                                            disabled={loading}
                                            className="text-red-500 text-xs font-bold hover:underline disabled:opacity-50"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button onClick={onClose} className="btn-outline px-6 py-2 text-sm font-bold">Close</button>

                    {isVolunteer && !hasSignedUp && !isFull && (
                        <button
                            onClick={() => handleAction('accept')}
                            disabled={loading}
                            className="bg-[#9F0059] text-white hover:bg-[#7a0045] px-6 py-2 rounded-full text-sm font-bold transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Accept Shift'}
                        </button>
                    )}

                    {isVolunteer && !hasSignedUp && isFull && (
                        <button
                            disabled
                            className="bg-gray-300 text-gray-500 px-6 py-2 rounded-full text-sm font-bold cursor-not-allowed"
                        >
                            Full
                        </button>
                    )}

                    {isVolunteer && hasSignedUp && (
                        <button
                            onClick={() => {
                                if (confirm("Are you sure you want to back out of this shift?")) {
                                    handleAction('withdraw');
                                }
                            }}
                            disabled={loading}
                            className="bg-red-100 text-red-600 hover:bg-red-200 px-6 py-2 rounded-full text-sm font-bold transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Back out'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
