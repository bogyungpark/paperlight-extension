#!/usr/bin/env bash
# Qwen 2.5 72B Instruct, AWQ 4-bit, tensor-parallel across both A6000s.
# OpenAI-compatible server on :8000. Foreground — wrap in tmux/screen.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Activate the venv created by vllm/setup.sh
# shellcheck disable=SC1091
source "$HERE/.venv/bin/activate"

MODEL="Qwen/Qwen2.5-72B-Instruct-AWQ"

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
