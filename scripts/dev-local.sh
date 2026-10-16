#!/usr/bin/env bash
# Run the app against the LOCAL Supabase stack (npm run db:start), not production.
# Reads the local API URL and publishable key from `supabase status`; these are Supabase's
# standard local demo values, not secrets. Process env wins over .env.local, so nothing in
# .env.local is read for Supabase here. Emails land in the local inbox at http://127.0.0.1:54324.
set -euo pipefail
cd "$(dirname "$0")/.."
eval "$(npx supabase status -o env 2>/dev/null | grep -E '^(API_URL|PUBLISHABLE_KEY)=')"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$PUBLISHABLE_KEY"
exec npx next dev --port "${PORT:-3001}"
