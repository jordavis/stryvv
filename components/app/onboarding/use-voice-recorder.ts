"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BITRATE, MIN_SECONDS, mustStop, pickRecordingType } from "@/lib/voice/recording"

// Records one voice answer and turns it into text (spec: docs/work/2026-11-04-voice-input/spec.md).
// idle → requesting (the browser's permission prompt) → recording → transcribing → idle.
// The recording only ever lives in memory: it's sent to /api/transcribe, kept for a retry if that
// fails, and dropped once it succeeds or the person records again, cancels or leaves.

export type VoiceStatus = "idle" | "requesting" | "recording" | "transcribing"

export type VoiceProblem = {
  kind: "unsupported" | "blocked" | "no-mic" | "failed" | "empty" | "limit"
  message: string
  canRetry: boolean
}

const PROBLEMS: Record<Exclude<VoiceProblem["kind"], "limit">, VoiceProblem> = {
  unsupported: { kind: "unsupported", message: "Voice isn't supported in this browser. You can type instead.", canRetry: false },
  blocked: { kind: "blocked", message: "Allow microphone access for this site to answer by voice.", canRetry: false },
  "no-mic": { kind: "no-mic", message: "No microphone found. You can type instead.", canRetry: false },
  failed: { kind: "failed", message: "Couldn't transcribe that. Try again", canRetry: true },
  empty: { kind: "empty", message: "I didn't catch anything. Try again, or type your answer.", canRetry: false },
}

export const LIMIT_REACHED_NOTICE = "That's the 5-minute limit. Here's what I heard."

export function useVoiceRecorder({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [status, setStatus] = useState<VoiceStatus>("idle")
  const [seconds, setSeconds] = useState(0)
  const [problem, setProblem] = useState<VoiceProblem | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])
  const bytes = useRef(0)
  const startedAt = useRef(0)
  const ticker = useRef<number | null>(null)
  const cancelled = useRef(false)
  const autoStopped = useRef(false)
  const lastRecording = useRef<Blob | null>(null)
  const transcriptHandler = useRef(onTranscript)
  useEffect(() => {
    transcriptHandler.current = onTranscript
  }, [onTranscript])

  /** Turns the microphone off (the browser's recording indicator goes away). */
  const release = useCallback(() => {
    if (ticker.current !== null) window.clearInterval(ticker.current)
    ticker.current = null
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
  }, [])

  useEffect(() => {
    return () => {
      cancelled.current = true
      if (recorder.current?.state === "recording") recorder.current.stop()
      release()
    }
  }, [release])

  const send = useCallback(async (recording: Blob) => {
    setStatus("transcribing")
    setProblem(null)
    try {
      const form = new FormData()
      form.append("audio", recording, recording.type.startsWith("audio/mp4") ? "voice.m4a" : "voice.webm")
      const response = await fetch("/api/transcribe", { method: "POST", body: form })
      const body = (await response.json().catch(() => ({}))) as { text?: string; error?: string }
      if (response.status === 429) {
        setProblem({ kind: "limit", message: body.error ?? "Let's pause voice for a moment. You can keep typing.", canRetry: false })
      } else if (!response.ok) {
        setProblem(PROBLEMS.failed)
      } else if (!body.text?.trim()) {
        lastRecording.current = null
        setProblem(PROBLEMS.empty)
      } else {
        lastRecording.current = null
        transcriptHandler.current(body.text.trim())
      }
    } catch {
      setProblem(PROBLEMS.failed)
    } finally {
      setStatus("idle")
    }
  }, [])

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop()
  }, [])

  const cancel = useCallback(() => {
    cancelled.current = true
    stop()
  }, [stop])

  const start = useCallback(async () => {
    setProblem(null)
    setNotice(null)
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setProblem(PROBLEMS.unsupported)
      return
    }
    const type = pickRecordingType((t) => MediaRecorder.isTypeSupported(t))
    if (!type) {
      setProblem(PROBLEMS.unsupported)
      return
    }

    setStatus("requesting")
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      setStatus("idle")
      const name = error instanceof DOMException ? error.name : ""
      setProblem(name === "NotFoundError" || name === "OverconstrainedError" ? PROBLEMS["no-mic"] : PROBLEMS.blocked)
      return
    }

    // A new recording replaces any earlier one waiting for a retry.
    lastRecording.current = null
    chunks.current = []
    bytes.current = 0
    cancelled.current = false
    autoStopped.current = false

    const rec = new MediaRecorder(stream.current, { mimeType: type, audioBitsPerSecond: BITRATE })
    recorder.current = rec
    rec.ondataavailable = (event) => {
      if (event.data.size === 0) return
      chunks.current.push(event.data)
      bytes.current += event.data.size
      if (mustStop((Date.now() - startedAt.current) / 1000, bytes.current) && rec.state === "recording") {
        autoStopped.current = true
        rec.stop()
      }
    }
    rec.onstop = () => {
      release()
      const length = (Date.now() - startedAt.current) / 1000
      if (cancelled.current || length < MIN_SECONDS || chunks.current.length === 0) {
        setStatus("idle")
        return
      }
      if (autoStopped.current) setNotice(LIMIT_REACHED_NOTICE)
      const recording = new Blob(chunks.current, { type: rec.mimeType || type })
      lastRecording.current = recording
      void send(recording)
    }

    startedAt.current = Date.now()
    setSeconds(0)
    rec.start(1000)
    setStatus("recording")
    ticker.current = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000
      setSeconds(elapsed)
      if (mustStop(elapsed, bytes.current) && rec.state === "recording") {
        autoStopped.current = true
        rec.stop()
      }
    }, 250)
  }, [release, send])

  const retry = useCallback(() => {
    if (lastRecording.current) void send(lastRecording.current)
  }, [send])

  const dismiss = useCallback(() => {
    setProblem(null)
    setNotice(null)
  }, [])

  return { status, seconds, problem, notice, start, stop, cancel, retry, dismiss }
}
