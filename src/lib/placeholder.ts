import sharp from 'sharp'

/** A tiny blurred preview of an image, inline as a data URL (~150 bytes): shown instantly
 *  while the real image loads, then crossfaded away. */
export async function placeholder(image: Buffer) {
  const out = await sharp(image).resize(16, 16, { fit: 'inside' }).webp({ quality: 50 }).toBuffer()
  return `data:image/webp;base64,${out.toString('base64')}`
}
