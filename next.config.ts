import type { NextConfig } from 'next'
import { BASE_PATH } from './src/lib/config'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: BASE_PATH,
  images: { unoptimized: true },
  trailingSlash: true,
}

export default nextConfig
