import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

/** Thin wrapper so pages never import the lexical renderer directly. */
export function RichText({ data, className }: { data: unknown; className?: string }) {
  if (!data) return null
  return <LexicalRichText data={data as SerializedEditorState} className={className} />
}
