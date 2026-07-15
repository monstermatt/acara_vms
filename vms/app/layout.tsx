'use client';

import { usePathname } from 'next/navigation';
import { Quicksand } from 'next/font/google';
import Sidebar from '@/app/components/Sidebar';
import './globals.css';
import Topbar from './components/topbar';
import { SessionProvider } from 'next-auth/react';
import { useState } from 'react';

const quicksand = Quicksand({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [collapsed, setCollapsed] = useState(true);

  return (
    <html lang="en">
      <body className={quicksand.className}>
        <SessionProvider>
          {isLoginPage ? (
            children
          ) : (
            <div className="min-h-screen bg-white">
              <aside
                className={`fixed left-0 top-0 z-50 h-screen transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
                  }`}
              >
                <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
              </aside>

              <div
                className={`flex min-h-screen flex-col transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'
                  }`}
              >
                <Topbar />
                <main className="flex-1 bg-white">{children}</main>
              </div>
            </div>
          )}
        </SessionProvider>
      </body>
    </html>
  );
}