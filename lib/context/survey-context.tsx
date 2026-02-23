"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react"
import type { SurveyAnswers } from "@/lib/types/survey"

const STORAGE_KEY = "stryvv_survey"

interface SurveyState {
  currentStep: number
  highestStep: number
  answers: Partial<SurveyAnswers>
  inviteCode: string | null
  startedAt: string | null
}

type SurveyAction =
  | { type: "SAVE_STEP"; step: number; data: Partial<SurveyAnswers> }
  | { type: "GO_TO_STEP"; step: number }
  | { type: "SET_INVITE_CODE"; code: string }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: SurveyState }

const initialState: SurveyState = {
  currentStep: 1,
  highestStep: 1,
  answers: {},
  inviteCode: null,
  startedAt: null,
}

function reducer(state: SurveyState, action: SurveyAction): SurveyState {
  switch (action.type) {
    case "SAVE_STEP":
      return {
        ...state,
        answers: { ...state.answers, ...action.data },
        currentStep: action.step + 1,
        highestStep: Math.max(state.highestStep, action.step + 1),
        startedAt: state.startedAt ?? new Date().toISOString(),
      }
    case "GO_TO_STEP":
      return { ...state, currentStep: action.step }
    case "SET_INVITE_CODE":
      return { ...state, inviteCode: action.code }
    case "RESET":
      return initialState
    case "HYDRATE":
      return action.state
    default:
      return state
  }
}

interface SurveyContextValue {
  state: SurveyState
  saveStep: (step: number, data: Partial<SurveyAnswers>) => void
  goToStep: (step: number) => void
  setInviteCode: (code: string) => void
  reset: () => void
}

const SurveyContext = createContext<SurveyContextValue | null>(null)

export function SurveyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        dispatch({ type: "HYDRATE", state: JSON.parse(saved) })
      }
    } catch {}
  }, [])

  // Persist on every state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  const saveStep = useCallback((step: number, data: Partial<SurveyAnswers>) => {
    dispatch({ type: "SAVE_STEP", step, data })
  }, [])

  const goToStep = useCallback((step: number) => {
    dispatch({ type: "GO_TO_STEP", step })
  }, [])

  const setInviteCode = useCallback((code: string) => {
    dispatch({ type: "SET_INVITE_CODE", code })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: "RESET" })
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }, [])

  return (
    <SurveyContext.Provider value={{ state, saveStep, goToStep, setInviteCode, reset }}>
      {children}
    </SurveyContext.Provider>
  )
}

export function useSurvey() {
  const ctx = useContext(SurveyContext)
  if (!ctx) throw new Error("useSurvey must be used within SurveyProvider")
  return ctx
}
