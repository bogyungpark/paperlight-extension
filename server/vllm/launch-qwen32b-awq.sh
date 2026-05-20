#!/usr/bin/env bash
# Qwen 2.5 32B Instruct, AWQ — single GPU. Quicker first-token latency
# than the 72B variant, ~10 GB VRAM.
#
# Run from inside tmux/screen — this stays foreground.
#   tmux new -s vllm
#   bash vllm/launch-qwen32b-awq.sh

set -euo pipefail

NAS="${PAPERLIGHT_NAS:-/nas04/data/bgPark/paperlight}"
VENV="$NAS/venv"
export HF_HOME="${HF_HOME:-$NAS/hf-cache}"
export CUDA_VISIBLE_DEVICES="${CUDA_VISIBLE_DEVICES:-0}"

if [[ ! -f "$VENV/bin/activate" ]]; then
  echo "venv not found at $VENV. Run vllm/setup.sh first." >&2
  exit 1
fi
# shellcheck disable=SC1091
source "$VENV/bin/activate"

MODEL="Qwen/Qwen2.5-32B-Instruct-AWQ"
echo "==> Launching vLLM"
echo "    model:           $MODEL"
echo "    HF_HOME:         $HF_HOME"
echo "    CUDA_VISIBLE:    $CUDA_VISIBLE_DEVICES"
echo "    listening on:    0.0.0.0:8000  (/v1)"

exec python -m vllm.entrypoints.openai.api_server \
  --model "$MODEL" \
  --quantization awq_marlin \
  --tensor-parallel-size 1 \
  --gpu-memory-utilization 0.85 \
  --max-model-len 32768 \
  --enable-prefix-caching \
  --host 0.0.0.0 \
  --port 8000 \
  --allowed-origins '["chrome-extension://*","moz-extension://*"]'
