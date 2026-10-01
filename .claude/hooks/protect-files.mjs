#!/usr/bin/env node
// PreToolUse(Edit|Write|MultiEdit): block edits to secrets and generated files.
import { readFileSync } from "node:fs"
import { basename } from "node:path"

const input = JSON.parse(readFileSync(0, "utf8"))
const file = input.tool_input?.file_path ?? ""
const name = basename(file)

const block = (reason) => {
  console.error(`Blocked by .claude/hooks/protect-files.mjs: ${reason}`)
  process.exit(2)
}

if (name.startsWith(".env") && name !== ".env.example") {
  block(`${name} holds secrets. Ask the user to edit it; update .env.example if a new variable is needed.`)
}

if (name === "package-lock.json") {
  block("package-lock.json is generated. Change dependencies with npm install / npm uninstall instead.")
}

process.exit(0)
