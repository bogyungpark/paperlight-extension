#!/usr/bin/env bash
# Paperlight — Ollama one-time setup for the GPU server.
# Idempotent: safe to re-run. Does NOT pull any model (do that yourself).
#
# Usage:
#   bash ollama/setup.sh

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DROPIN_SRC="$HERE/ollama-paperlight.conf"
DROPIN_DIR=/etc/systemd/system/ollama.service.d
DROPIN_DST="$DROPIN_DIR/paperlight.conf"

need_sudo() {
  if [[ $EUID -ne 0 ]]; then
    echo "sudo $*"
    sudo "$@"
  else
    "$@"
  fi
}

echo "==> 1. Installing Ollama (skip if already present)"
if ! command -v ollama >/dev/null 2>&1; then
  curl -fsSL https://ollama.com/install.sh | sh
else
  echo "    ollama already installed: $(ollama --version 2>/dev/null || true)"
fi

echo "==> 2. Writing systemd drop-in for LAN + CORS"
if [[ ! -f "$DROPIN_SRC" ]]; then
  echo "    missing $DROPIN_SRC" >&2
  exit 1
fi
need_sudo mkdir -p "$DROPIN_DIR"
need_sudo cp "$DROPIN_SRC" "$DROPIN_DST"
need_sudo systemctl daemon-reload

echo
echo "==> Setup written. Restart Ollama yourself with:"
echo
echo "    sudo systemctl restart ollama"
echo "    sudo systemctl status ollama --no-pager"
echo
echo "Then pull a model from models.md, e.g.:"
echo
echo "    ollama pull qwen2.5:72b-instruct-q4_K_M"
echo
echo "Smoke test from your laptop:"
echo
echo "    curl http://192.168.110.106:11434/v1/models"
