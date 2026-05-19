#!/usr/bin/env bash
# Qwen 2.5 32B Instruct, AWQ — single GPU. Quicker first-token latency
# than the 72B variant, ~10 GB VRAM per GPU.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$HERE/.venv/bin/activate"

MODEL="Qwen/Qwen2.5-32B-Instruct-AWQ"

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
