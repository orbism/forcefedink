import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Artworks } from './collections/Artworks'
import { Drops } from './collections/Drops'
import { Enquiries } from './collections/Enquiries'
import { Faqs } from './collections/Faqs'
import { Media } from './collections/Media'
import { Originals } from './collections/Originals'
import { Series } from './collections/Series'
import { Subscribers } from './collections/Subscribers'
import { Users } from './collections/Users'
import { Commissions } from './globals/Commissions'
import { SiteSettings } from './globals/SiteSettings'
import { env, hasBlob, hasResend } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: '· Force Fed Ink',
    },
  },
  collections: [Artworks, Series, Drops, Originals, Media, Faqs, Enquiries, Subscribers, Users],
  globals: [SiteSettings, Commissions],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  serverURL: env.NEXT_PUBLIC_SERVER_URL,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },

  // Drizzle/node-postgres. Works against local Postgres and against Prisma Postgres's
  // direct TCP URL — see docs/LESSONS.md for why db-vercel-postgres is the wrong adapter here.
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URI },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),

  // Without a Resend key, Payload's default transport logs to the console — fine for local.
  ...(hasResend
    ? {
        email: resendAdapter({
          defaultFromAddress: env.EMAIL_FROM,
          defaultFromName: 'Force Fed Ink',
          apiKey: env.RESEND_API_KEY!,
        }),
      }
    : {}),

  sharp,
  plugins: [
    seoPlugin({
      collections: ['artworks', 'drops', 'series'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => `${doc?.title ?? 'Force Fed Ink'} · Force Fed Ink`,
    }),
    // Only mount blob storage when a token exists; otherwise uploads land on disk.
    ...(hasBlob
      ? [
          vercelBlobStorage({
            collections: { media: true },
            token: env.BLOB_READ_WRITE_TOKEN!,
          }),
        ]
      : []),
  ],
})
