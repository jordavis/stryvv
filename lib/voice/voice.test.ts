import { describe, expect, it } from "vitest"
import { checkTranscriptionLimits, VOICE_PAUSE_MESSAGE } from "./limits"
import { formatClock, MAX_BYTES, MAX_SECONDS, mustStop, pickRecordingType } from "./recording"
import { checkUpload } from "./schemas"
import { appendTranscript } from "./text"

describe("pickRecordingType", () => {
  it("prefers webm with Opus (Chrome, Edge, Firefox)", () => {
    expect(pickRecordingType(() => true)).toBe("audio/webm;codecs=opus")
  })

  it("falls back to mp4 (Safari, including iPhone)", () => {
    expect(pickRecordingType((t) => t === "audio/mp4")).toBe("audio/mp4")
  })

  it("never picks Ogg, which gpt-transcribe rejects", () => {
    expect(pickRecordingType((t) => t.startsWith("audio/ogg"))).toBeNull()
  })
})

describe("recording limits", () => {
  it("shows elapsed time against the 5-minute limit", () => {
    expect(formatClock(42)).toBe("0:42 / 5:00")
    expect(formatClock(299.9)).toBe("4:59 / 5:00")
  })

  it("stops at 5 minutes, or at 4 MB if the bitrate was ignored", () => {
    expect(mustStop(MAX_SECONDS - 1, 1000)).toBeNull()
    expect(mustStop(MAX_SECONDS, 1000)).toBe("time")
    expect(mustStop(60, MAX_BYTES)).toBe("size")
  })
})

describe("checkUpload", () => {
  it("accepts webm and mp4, with or without codec parameters", () => {
    expect(checkUpload({ type: "audio/webm;codecs=opus", size: 1000 })).toEqual({ ok: true, type: "audio/webm" })
    expect(checkUpload({ type: "audio/mp4", size: 1000 })).toEqual({ ok: true, type: "audio/mp4" })
  })

  it("refuses no file, an empty file, an oversized file or another type", () => {
    expect(checkUpload(null)).toEqual({ ok: false, status: 400 })
    expect(checkUpload({ type: "audio/webm", size: 0 })).toEqual({ ok: false, status: 400 })
    expect(checkUpload({ type: "audio/webm", size: MAX_BYTES + 1 })).toEqual({ ok: false, status: 413 })
    expect(checkUpload({ type: "audio/ogg", size: 1000 })).toEqual({ ok: false, status: 415 })
    expect(checkUpload({ type: "text/plain", size: 1000 })).toEqual({ ok: false, status: 415 })
  })
})

describe("checkTranscriptionLimits", () => {
  it("allows the 5th request in a minute and the 60th in a day, not more", () => {
    expect(checkTranscriptionLimits({ lastMinute: 4, lastDay: 59 })).toEqual({ ok: true })
    expect(checkTranscriptionLimits({ lastMinute: 5, lastDay: 10 })).toEqual({ ok: false, message: VOICE_PAUSE_MESSAGE })
    expect(checkTranscriptionLimits({ lastMinute: 0, lastDay: 60 })).toEqual({ ok: false, message: VOICE_PAUSE_MESSAGE })
  })
})

describe("appendTranscript", () => {
  it("adds the transcript after a single space", () => {
    expect(appendTranscript("Money was tight.  ", "  Dad worked two jobs. ")).toEqual({
      text: "Money was tight. Dad worked two jobs.",
      truncated: false,
    })
  })

  it("uses the transcript alone when the box is empty", () => {
    expect(appendTranscript("", "Hello")).toEqual({ text: "Hello", truncated: false })
  })

  it("keeps what fits and says it was cut", () => {
    expect(appendTranscript("abc", "defgh", 6)).toEqual({ text: "abc de", truncated: true })
  })
})
