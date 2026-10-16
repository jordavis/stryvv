// Light checks the browser runs so a form's button only lights up when it could succeed.
// They must never reject something the server accepts; lib/validation/auth.ts has the real rules.

/** Between 7 digits (the shortest international numbers, with country code) and 15 (the E.164 maximum). */
export function looksLikePhone(input: string) {
  const digits = input.replace(/\D/g, "").length
  return digits >= 7 && digits <= 15
}
