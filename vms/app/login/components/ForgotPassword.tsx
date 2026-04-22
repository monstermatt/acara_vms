'use client'
import { useState } from 'react'

type LoginView = 'login' | 'forgotpassword' | 'accountsetup'

interface Props {
    setView: (view: LoginView) => void
}

const ForgotPassword = ({ setView }: Props) => {
    const [resetEmail, setResetEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false) //loading state to disable button while network request processes

    const submitPasswordReset = async (e: React.SyntheticEvent) => {
        e.preventDefault()
        setSubmitted(true)

        try {
            // Call the API route 
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: resetEmail }),
            });

            if (!response.ok) {
                console.warn("There was an issue hitting the forgot-password endpoint.");
            }

            //show the success screen even if the email doesn't exist in the database.
            setSubmitted(true)
        } catch (error) {
            console.error("Network error when attempting to send reset email:", error);
            setSubmitted(true) 
        } finally {
            setIsSubmitting(false)
        }
    }
    

    // Password Reset Success view
    if (submitted) {
        return (
            <>
                <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
                    Reset your Password
                </h1>
                <p className="text-sm text-gray-600 text-center mb-8">
                    An email with instructions to reset your password has been sent to: <strong>{resetEmail}</strong>
                </p>

                <div className="flex justify-center pt-2">
                    <button
                        type="button"
                        onClick={() => setView('login')}
                        className="login-action-btn"
                    >
                        Back to login
                    </button>
                </div>
            </>
        )
    }

    // reset password view
    return (
        <>
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
                Reset your Password
            </h1>
            <p className="text-sm text-gray-600 text-center mb-8">
                Please enter your email to reset your password
            </p>

            <form onSubmit={submitPasswordReset} className="space-y-4">
                <div>
                    <input
                        type="email"
                        placeholder="Email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="login-fields"
                        required
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="login-action-btn"
                    >
                        Reset Password
                    </button>
                </div>

                <div className="flex justify-center pt-2">
                    <button
                        type="button"
                        onClick={() => setView('login')}
                        className="login-action-link fixed bottom-17 -translate-x-0.5"
                    >
                        Back to login
                    </button>
                </div>
            </form>
        </>
    )
}

export default ForgotPassword
