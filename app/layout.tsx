import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
// import Sidebar from '../src/components/Sidebar';
import UserBar from '../src/components/UserBar';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Events Planning',
  description: 'Create and manage your events',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Hide sidebar on auth pages
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  // const hideSidebar = pathname.startsWith('/auth');

  return (
    <html lang="en">
      <body className={inter.className}>
        <UserBar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
} 