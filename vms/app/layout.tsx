'use client';
import { usePathname } from 'next/navigation';
import { Quicksand } from 'next/font/google';
import Sidebar from '@/app/components/Sidebar';
import './globals.css';

const quicksand = Quicksand({subsets: ['latin']});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="en">
      <body className={quicksand.className}>
        {isLoginPage ? (
          children
        ) : (
          <div className="flex">
            <Sidebar />
            <main className="flex-1 bg-white">
              {children}
            </main>
          </div>
        )}
      </body>
    </html>
  );
}
