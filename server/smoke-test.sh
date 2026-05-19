#!/usr/bin/env bash
# Smoke test for the Paperlight inference endpoint.
# Run from anywhere on the LAN. Defaults to the GPU host on the standard
# Ollama port; override the URL / model with env vars.
#
# Examples:
#   bash smoke-test.sh
#   PL_URL=http://192.168.110.106:8000/v1 PL_MODEL=Qwen/Qwen2.5-72B-Instruct-AWQ bash smoke-test.sh

set -euo pipefail

URL="${PL_URL:-http://192.168.110.106:11434/v1}"
MODEL="${PL_MODEL:-qwen2.5:72b-instruct-q4_K_M}"

echo "==> Listing models at $URL/models"
curl -sS "$URL/models" | head -c 1000 ; echo

echo
echo "==> Streaming a tiny completion against model=$MODEL"
curl -sS -N "$URL/chat/completions" \
  -H 'Content-Type: application/json' \
  -d "$(cat <<EOF
{
  "model": "$MODEL",
  "stream": true,
  "messages": [
    {"role":"system","content":"You are Paperlight, a concise research assistant."},
    {"role":"user","content":"Reply with one short sentence: are you alive?"}
  ]
}
EOF
)" | head -c 2000
echo
echo
echo "If you saw 'data: {…}' chunks above, Paperlight will work against this endpoint."
