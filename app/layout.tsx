import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayout from '../src/components/ClientLayout';

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
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
} 