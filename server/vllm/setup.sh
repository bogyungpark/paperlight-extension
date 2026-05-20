#!/usr/bin/env bash
# Paperlight — vLLM one-time setup (no sudo required).
#
# Creates a Python venv on the NAS so the GPU box's system-level /usr stays
# untouched (the operator isn't in sudoers, by design) and the model cache
# lives on the big NFS volume instead of /home.
#
# Override paths with env vars if you want:
#   PAPERLIGHT_NAS=/some/other/path bash vllm/setup.sh

set -euo pipefail

NAS="${PAPERLIGHT_NAS:-/nas04/data/bgPark/paperlight}"
VENV="$NAS/venv"
HF_CACHE="$NAS/hf-cache"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found on PATH" >&2
  exit 1
fi

echo "==> NAS root:        $NAS"
echo "==> venv:            $VENV"
echo "==> HF cache:        $HF_CACHE"
mkdir -p "$VENV" "$HF_CACHE"

if [[ ! -f "$VENV/bin/activate" ]]; then
  echo "==> Creating venv (python3 -m venv $VENV)"
  python3 -m venv "$VENV"
else
  echo "==> venv already present, reusing"
fi

# shellcheck disable=SC1091
source "$VENV/bin/activate"

echo "==> Upgrading pip / wheel"
pip install --upgrade pip wheel

echo "==> Installing vLLM (this downloads a ~1.2 GB wheel; first run is slow)"
pip install "vllm>=0.6.3"

echo
echo "Done."
echo
echo "Next:"
echo "  tmux new -s vllm"
echo "  bash vllm/launch-qwen32b-awq.sh        # single GPU, snappy"
echo "  # or  bash vllm/launch-qwen72b-awq.sh  # uses both A6000s (TP=2)"
echo
echo "Activate the venv directly if needed:"
echo "  source $VENV/bin/activate"
