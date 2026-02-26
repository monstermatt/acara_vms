'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [ email,setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail,setResetEmail] = useState('');

  return(
    <div className="flex h-screen">

      {/* Left half page image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="/acara-login.png"
          alt="Login placeholder"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Acara logo */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 bg-white">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Image
              src="/acara-logo.jpg"
              alt="Logo placeholder"
              width={80}
              height={80}
              className="rounded-lg"
            />
          </div>

          {/* Main login view */}
          {!showForgotPassword ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
                Welcome Back!
              </h1>
              <p className="text-sm text-gray-600 text-center mb-8">
                Please enter your credentials to access the system
              </p>

              <form onSubmit={(e) => { e.preventDefault(); router.push('/dashboard'); }} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-fields"
                    required
                  />
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-fields"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="login-action-link"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="login-action-btn"
                  >
                    Login
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>

            {/* Reset password view */}
              <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
                Reset your password
              </h1>
              <p className="text-sm text-gray-600 text-center mb-8">
                Please enter your email to reset your password
              </p>

              <form onSubmit={(e) => { e.preventDefault(); setShowForgotPassword(false); }} className="space-y-4">
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
                    onClick={() => setShowForgotPassword(false)}
                    className="login-action-link"
                  >
                    Back to login
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
