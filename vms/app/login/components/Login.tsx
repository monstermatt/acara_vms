'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UnhidePasswordIcon, HidePasswordIcon } from '@/icons';
import { signIn } from 'next-auth/react';

type LoginView = 'login' | 'forgotpassword' | 'accountsetup'

interface Props {
  setView: (view: LoginView) => void
}

const Login = ({ setView }: Props) => {

  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false)

  // Defining errors
  const [invalidEmail, setInvalidEmail] = useState(false)
  const [invalidPassword, setInvalidPassword] = useState(false)
  const [invalidCredentials, setInvalidCredentials] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const submitCredentials = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setIsPending(true)
    setInvalidCredentials(false)

    //NextAuth SignIn
    const result = await signIn('credentials', {
      redirect: false,
      email: email,
      password: password,
    })

    setIsPending(false)

    if (result?.error) {
      setInvalidCredentials(true);
    }else {
      router.push('/dashboard')
    }

    // resetting errors
    setInvalidEmail(false)
    setInvalidPassword(false)
    setInvalidCredentials(false)

    let isInvalid = false
    if (!email) { setInvalidEmail(true); isInvalid = true }
    if (!password) { setInvalidPassword(true); isInvalid = true }
    if (isInvalid) return

    try {
              const success = false

      if (!success) {
        setInvalidEmail(true)
        setInvalidPassword(true)
        setInvalidCredentials(true)
        return
      }

      router.push('/dashboard')
    } catch (error) {
      setInvalidCredentials(true)
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
        Welcome Back!
      </h1>

      {/* Messages for enter credentials / invalid credentials */}
      <p className={`text-sm text-center mb-8 ${invalidCredentials
        ? 'text-red-500'
        : ' text-gray-600'
        }`}>
        {invalidCredentials
          ? 'Invalid Credentials, please insert valid ones and try again'
          : 'Please enter your credentials to access the system'
        }
      </p>

      <form onSubmit={submitCredentials} className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setInvalidEmail(false)
              setInvalidCredentials(false)
            }}
            className={`login-fields ${invalidEmail
              ? 'border-[#FF0004] focus:ring-[#FF0004] text-[#FF0004]'
              : ''
              }`}
            required
          />
        </div>

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setInvalidPassword(false)
              setInvalidCredentials(false)
            }}
            className={`login-fields pr-10 ${invalidPassword
              ? 'border-[#FF0004] focus:ring-[#FF0004] text-[#FF0004]'
              : ''
              }`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`hide-password ${invalidPassword
              ? 'text-[#FF0004] hover:text-[#FF0004]'
              : 'text-[#9A9A9A] hover:text-[#9A9A9A]'
              }`}
          >
            {showPassword
              ? <HidePasswordIcon />
              : <UnhidePasswordIcon />
            }
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setView('forgotpassword')}
            className="login-action-link"
          >
            Forgot password?
          </button>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="login-action-btn"
            disabled={isPending}
          >
            {isPending ? 'Authenticating...' : 'Login'}
          </button>
        </div>
      </form>
    </>
  )
}

export default Login