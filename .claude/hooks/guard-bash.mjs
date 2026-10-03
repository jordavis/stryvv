#!/usr/bin/env node
// PreToolUse(Bash): block commands that bypass the PR gate or touch production.
// Exit 2 blocks the command; stderr is shown to Claude with the route to approval.
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"

const input = JSON.parse(readFileSync(0, "utf8"))
const cmd = input.tool_input?.command ?? ""

const block = (reason) => {
  console.error(`Blocked by .claude/hooks/guard-bash.mjs: ${reason}`)
  process.exit(2)
}

const currentBranch = () => {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { cwd: input.cwd, encoding: "utf8" }).trim()
  } catch {
    return ""
  }
}

for (const push of cmd.match(/\bgit\s+push\b[^;&|]*/g) ?? []) {
  if (/\s(-f|--force)(\s|$)/.test(push)) {
    block("force push is not allowed. Use --force-with-lease on your own feature branch, or ask the user.")
  }
  const explicitMain = /(\s|:)(main|master)(\s|$)/.test(push)
  const hasRefspec = push.trim().split(/\s+/).filter((a) => !a.startsWith("-")).length > 3
  if (explicitMain || (!hasRefspec && ["main", "master"].includes(currentBranch()))) {
    block("pushing to main deploys production. Create a branch and open a PR (see the ship skill).")
  }
}

if (/\bgh\s+pr\s+merge\b/.test(cmd)) {
  block("merging a PR deploys production. The user merges after reviewing.")
}

if (/\bvercel\b.*(--prod\b|\bpromote\b)/.test(cmd)) {
  block("production deploys go through merging to main. Ask the user if a manual production deploy is really needed.")
}

if (/\bsupabase\s+db\s+(reset|push)\b/.test(cmd) || /\bsupabase\s+migration\s+repair\b/.test(cmd)) {
  block("this changes a Supabase database directly. Ask the user to run it themselves after reviewing the migration.")
}

process.exit(0)
