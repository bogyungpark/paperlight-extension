#!/usr/bin/env bash
# Qwen 2.5 72B Instruct, AWQ 4-bit, tensor-parallel across both A6000s.
# OpenAI-compatible server on :8000. Foreground — wrap in tmux/screen.
#
#   tmux new -s vllm
#   bash vllm/launch-qwen72b-awq.sh
#
# To pin to one GPU instead, prepend CUDA_VISIBLE_DEVICES=0 and change
# --tensor-parallel-size to 1.

set -euo pipefail

NAS="${PAPERLIGHT_NAS:-/nas04/data/bgPark/paperlight}"
VENV="$NAS/venv"
export HF_HOME="${HF_HOME:-$NAS/hf-cache}"

if [[ ! -f "$VENV/bin/activate" ]]; then
  echo "venv not found at $VENV. Run vllm/setup.sh first." >&2
  exit 1
fi
# shellcheck disable=SC1091
source "$VENV/bin/activate"

MODEL="Qwen/Qwen2.5-72B-Instruct-AWQ"
echo "==> Launching vLLM"
echo "    model:           $MODEL"
echo "    HF_HOME:         $HF_HOME"
echo "    listening on:    0.0.0.0:8000  (/v1)"

exec python -m vllm.entrypoints.openai.api_server \
  --model "$MODEL" \
  --quantization awq_marlin \
  --tensor-parallel-size 2 \
  --gpu-memory-utilization 0.90 \
  --max-model-len 32768 \
  --enable-prefix-caching \
  --host 0.0.0.0 \
  --port 8000 \
  --allowed-origins '["chrome-extension://*","moz-extension://*"]'
