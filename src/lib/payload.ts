import configPromise from '@payload-config'
import { getPayload } from 'payload'

/** Cached Payload instance for server components. */
export const getPayloadClient = () => getPayload({ config: configPromise })
