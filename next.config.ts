import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

// Payload serves media as absolute URLs (serverURL locally, Vercel Blob in production),
// so both origins have to be allowed for next/image.
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3100'
const { hostname, protocol, port } = new URL(serverUrl)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
    remotePatterns: [
      {
        protocol: protocol.replace(':', '') as 'http' | 'https',
        hostname,
        port: port || undefined,
        pathname: '/api/media/file/**',
      },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
