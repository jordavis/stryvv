import { MAX_BYTES } from "./recording"

/** Upload types the server accepts (the base type, without codec parameters). */
export const ACCEPTED_TYPES = ["audio/webm", "audio/mp4"] as const

export type UploadCheck = { ok: true; type: (typeof ACCEPTED_TYPES)[number] } | { ok: false; status: 400 | 413 | 415 }

/** Checks an uploaded recording before anything is counted or sent (spec requirement 12). */
export function checkUpload(file: { type: string; size: number } | null): UploadCheck {
  if (!file || file.size < 1) return { ok: false, status: 400 }
  if (file.size > MAX_BYTES) return { ok: false, status: 413 }
  const base = file.type.split(";")[0].trim().toLowerCase()
  const type = ACCEPTED_TYPES.find((t) => t === base)
  if (!type) return { ok: false, status: 415 }
  return { ok: true, type }
}
