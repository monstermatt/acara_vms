'use client';
import Image from 'next/image';
import { useEffect, useState, Suspense } from 'react';
import {useSearchParams} from 'next/navigation';
import Login from './components/Login'
import ForgotPassword from './components/ForgotPassword'
import AccountSetup from './components/AccountSetup'


type LoginView = 'login' | 'forgotpassword' | 'accountsetup'

function LoginContent() {
  const [view, setView] = useState<LoginView>('login')
  const searchParams = useSearchParams();

  useEffect(() => {
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');
    if (uid && token) {
      setView('accountsetup');
    }
  }, [searchParams]);

  return (
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

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-8 bg-white">
        <div className="w-full max-w-md pb-50">

          {/* Acara logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/acara-logo.png"
              alt="Logo placeholder"
              width={123}
              height={109}
              className="rounded-lg"
            />
          </div>

          {/* Implementing views below logo */}
          {view === 'login' && <Login setView={setView} />}
          {view === 'forgotpassword' && <ForgotPassword setView={setView} />}
          {view === 'accountsetup' && <AccountSetup setView={setView} />}

        </div>
        <div className="fixed bottom-3 -translate-x-0.5 w-full text-center py-4">
          <p className="text-sm text-gray-600">

            {/* Linked to account setup view for testing/dev purposes */}
            Don't have an account? <button onClick={() => setView('accountsetup')}
              className="login-action-link">
              Contact Us
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Next.js App Router requires useSearchParams to be wrapped in a Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );

}

