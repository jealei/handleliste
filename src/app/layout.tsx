import type { ReactNode } from 'react'

export default function RotOppsett({ children }: { children: ReactNode }) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  )
}
