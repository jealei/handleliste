import type { MetadataRoute } from 'next'
import { BASE_PATH, offentligSti } from '@/lib/config'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Handleliste Tønsberg',
    short_name: 'Handleliste',
    description: 'Handleliste for Tønsberg',
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: 'standalone',
    background_color: '#1b4d3e',
    theme_color: '#1b4d3e',
    lang: 'nb',
    icons: [
      { src: offentligSti('ikon-192.png'), sizes: '192x192', type: 'image/png' },
      { src: offentligSti('ikon-512.png'), sizes: '512x512', type: 'image/png' },
      {
        src: offentligSti('ikon-maskable-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
