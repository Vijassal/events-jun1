import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayout from '../src/components/ClientLayout'
import AuthProtection from '../src/components/AuthProtection'

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
        <AuthProtection>
          <ClientLayout>{children}</ClientLayout>
        </AuthProtection>
      </body>
    </html>
  )
} 