import { describe, expect, it } from "vitest"
import {
  checkLimits,
  CONVERSATION_FULL_MESSAGE,
  MAX_USER_MESSAGES_PER_CONVERSATION,
  MAX_USER_MESSAGES_PER_MINUTE,
  PAUSE_MESSAGE,
} from "./limits"

describe("checkLimits", () => {
  it("lets a normal message through", () => {
    expect(checkLimits({ inConversation: 10, lastMinute: 2 })).toEqual({ ok: true })
  })

  it("allows the 60th message but not the 61st", () => {
    expect(checkLimits({ inConversation: MAX_USER_MESSAGES_PER_CONVERSATION - 1, lastMinute: 0 }).ok).toBe(true)
    expect(checkLimits({ inConversation: MAX_USER_MESSAGES_PER_CONVERSATION, lastMinute: 0 })).toEqual({
      ok: false,
      message: CONVERSATION_FULL_MESSAGE,
    })
  })

  it("pauses after 20 messages in a minute", () => {
    expect(checkLimits({ inConversation: 30, lastMinute: MAX_USER_MESSAGES_PER_MINUTE - 1 }).ok).toBe(true)
    expect(checkLimits({ inConversation: 30, lastMinute: MAX_USER_MESSAGES_PER_MINUTE })).toEqual({
      ok: false,
      message: PAUSE_MESSAGE,
    })
  })
})
