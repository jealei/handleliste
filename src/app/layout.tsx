import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { RegistrerSW } from '@/components/RegistrerSW'
import { offentligSti } from '@/lib/config'
import './globals.css'

export const metadata: Metadata = {
  title: 'Handleliste Tønsberg',
  description: 'Handleliste for Tønsberg',
  manifest: offentligSti('manifest.webmanifest'),
  icons: {
    icon: offentligSti('ikon-192.png'),
    apple: offentligSti('ikon-192.png'),
  },
  appleWebApp: {
    capable: true,
    title: 'Handleliste',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Ikke lås zoom — brukeren må kunne forstørre teksten.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6f2' },
    { media: '(prefers-color-scheme: dark)', color: '#121715' },
  ],
}

export default function RotOppsett({ children }: { children: ReactNode }) {
  return (
    <html lang="nb">
      <body>
        {children}
        <RegistrerSW />
      </body>
    </html>
  )
}
