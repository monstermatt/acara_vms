"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface MessageModalProps {
    volunteerId: number;
    volunteerName: string;
    phoneNumber?: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function MessageModal({
    volunteerId,
    volunteerName,
    phoneNumber,
    onClose,
    onSuccess,
}: MessageModalProps) {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { data: session } = useSession();

    const handleSend = async () => {
        if (!message.trim()) {
            setError("Message cannot be empty.");
            return;
        }

        setIsSending(true);
        setError(null);
        const token = (session as any)?.accessToken;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/messages/send/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    volunteerId,
                    message,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send message.");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Error sending message:", err);
            setError(err.message || "An error occurred while sending the message.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Send Message to {volunteerName}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {phoneNumber ? (
                    <p className="text-sm text-gray-600 mb-4">
                        Sending to: <span className="font-medium">{phoneNumber}</span>
                    </p>
                ) : (
                    <p className="text-sm text-red-600 mb-4 font-medium">
                        Warning: No phone number available for this volunteer.
                    </p>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                        {error}
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full h-32 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#9F0059] focus:border-transparent resize-none"
                        placeholder="Type your message here..."
                        disabled={isSending || !phoneNumber}
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSending}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isSending || !phoneNumber || !message.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#9F0059] hover:bg-[#7a0045] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? "Sending..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
}
