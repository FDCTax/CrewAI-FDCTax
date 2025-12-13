import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FDC Tax – Luna Onboarding (SANDBOX)',
  description: 'Sandbox environment for new client onboarding flow',
}

function SandboxBanner() {
  return (
    <div className="bg-red-600 text-white py-2 px-4 text-center font-semibold text-sm sticky top-0 z-50 shadow-md">
      🚧 SANDBOX ENVIRONMENT 🚧
    </div>
  )
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SandboxBanner />
        {children}
      </body>
    </html>
  )
}