#!/usr/bin/env bash
# Paperlight — vLLM one-time setup (CPU-side only; no GPU is touched).
#
# Usage:
#   bash vllm/setup.sh

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$HERE/.venv"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found — install Python 3.10+ first" >&2
  exit 1
fi

echo "==> Creating venv at $VENV"
python3 -m venv "$VENV"
# shellcheck disable=SC1091
source "$VENV/bin/activate"

echo "==> Upgrading pip"
pip install --upgrade pip wheel

echo "==> Installing vLLM (this downloads a big wheel, ~1.2 GB)"
pip install "vllm>=0.6.3"

echo
echo "Done. Activate with:"
echo "    source $VENV/bin/activate"
echo
echo "Then launch one of:"
echo "    bash vllm/launch-qwen72b-awq.sh"
echo "    bash vllm/launch-qwen32b-awq.sh"
echo "    bash vllm/launch-llama3.3-70b.sh"
