'use client'
import { useState } from 'react'
import { UnhidePasswordIcon, HidePasswordIcon } from '@/icons';
import { useSearchParams, useRouter } from 'next/navigation';

type LoginView = 'login' | 'forgotpassword' | 'accountsetup'

interface Props {
    setView: (view: LoginView) => void
    mode?: 'new' | 'reset'
}

const AccountSetup = ({ setView, mode = 'new' }: Props) => {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const searchParams = useSearchParams();
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');

    const submitSetup = async (e: React.SyntheticEvent) => {
        e.preventDefault()
        if (password != confirmPassword) {
            setError('Passwords do not match')
            return
        }
    //Django token verification and password reset API call
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/confirm-password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({uid, token, password}),
    })
    if (res.ok) {
        setSuccess(true);
    } else {
        setError('Failed to reset password. Please try again.')
    }

    // Placeholder for better password strength logic
    if (password.length < 5) {
        setError('Password must be at least 5 characters')
        return
    }
    setSuccess(true)
    }

    // Show/hide password button
    const viewPassword = (
        <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className='hide-password'
        >
            {showPassword
                ? <HidePasswordIcon />
                : <UnhidePasswordIcon />
            }
        </button>
    )

    // Password Creation success view
    if (success) {
        return (
            <>
                <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
                    Welcome Back!
                </h1>
                <p className="text-sm text-[#008D3A] text-center mb-8">
                    {mode === 'reset'
                        ? 'Your password has been successfully updated. You can now log in'
                        : 'Your account has been successfully created. You can now log in'
                    }
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

    // Password Creation view
    return (
        <>
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
                {mode === 'reset'
                    ? 'Set new password'
                    : 'Create your account'
                }
            </h1>
            <div className="text-sm text-gray-600 text-center mb-8">
                {mode === 'reset'
                    ? 'Please enter a new password'
                    : 'To get started, please create a password for your account.'
                }
                {error && <p className='text-sm text-[#B71111]'>{error}</p>}
            </div>

            <form onSubmit={submitSetup} className="space-y-4">
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError('') }}
                        className="login-fields pr-10"
                        required
                    />
                    {viewPassword}
                </div>
                <div className='relative'>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Repeat Password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                        className="login-fields pr-10"
                        required
                    />
                    {viewPassword}
                </div>
                <div className="pt-4">
                    <button type="submit" className="login-action-btn">
                        {mode === 'reset' ? 'Continue' : 'Continue'}
                    </button>
                </div>
            </form>
        </>
    )
}

export default AccountSetup