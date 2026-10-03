#!/usr/bin/env node
// PostToolUse(Edit|Write|MultiEdit): lint just the edited file so errors surface immediately.
// Reports errors to Claude (exit 2) but never changes the file.
import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const input = JSON.parse(readFileSync(0, "utf8"))
const file = input.tool_input?.file_path ?? ""
const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd

if (!/\.(ts|tsx|js|mjs)$/.test(file) || /node_modules|\.next\//.test(file)) process.exit(0)

const result = spawnSync(join(root, "node_modules/.bin/eslint"), ["--quiet", file], {
  cwd: root,
  encoding: "utf8",
})

if (result.status === 1) {
  console.error(`ESLint errors in ${file}:\n${result.stdout}`)
  process.exit(2)
}
process.exit(0)
