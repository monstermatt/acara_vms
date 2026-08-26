'use client';

import { useState } from 'react';

interface ContactUsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ContactUsModal({ isOpen, onClose }: ContactUsModalProps) {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to send message');

            setIsSuccess(true);
            setFormData({ name: '', email: '', message: '' });
        } catch (err) {
            setError('Error sending message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }

    };

    const handleClose = () => {
        setIsSuccess(false);
        setFormData({ name: '', email: '', message: '' });
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

            {isSuccess ? (
                // SUCCESS SCREEN (Matching BookingModal)
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-12 flex flex-col items-center relative transition-all duration-300 transform scale-100">
                    <h2 className="text-4xl font-bold text-primary mb-3 text-center">Message Sent</h2>
                    <p className="text-gray-500 mb-8 text-center text-lg">Thank you for reaching out! We will get back to you shortly.</p>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="btn-primary px-16 text-lg shadow-md"
                    >
                        Close
                    </button>
                </div>
            ) : (
                // CONTACT FORM
                <div className="bg-white p-8 rounded-3xl w-full max-w-2xl relative">
                    <h2 className="text-4xl font-bold text-primary mb-2">Contact Us</h2>
                    <p className="text-gray-500 mb-8 text-lg">Send us a message and we'll get back to you shortly.</p>

                    {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="border border-gray-400 rounded-2xl p-8 mb-8 flex flex-col gap-6">

                            <div className="flex flex-col gap-2">
                                <label htmlFor="name" className="font-bold text-gray-800">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    className="input-style flex-1 bg-white"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="email" className="font-bold text-gray-800">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    className="input-style flex-1 bg-white"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="message" className="font-bold text-gray-800">Message</label>
                                <textarea
                                    id="message"
                                    required
                                    rows={5}
                                    className="input-style flex-1 bg-white resize-none"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                ></textarea>
                            </div>

                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn-primary w-40 flex justify-center items-center"
                            >
                                {isSubmitting ? 'Sending...' : 'Send'}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="btn-outline w-40 font-bold"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
