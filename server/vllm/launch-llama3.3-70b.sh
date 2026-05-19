#!/usr/bin/env bash
# Meta Llama 3.3 70B Instruct, AWQ 4-bit (community quant), TP=2.
# Note: gated on Hugging Face. Export HF_TOKEN before running.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$HERE/.venv/bin/activate"

if [[ -z "${HF_TOKEN:-}" ]]; then
  echo "Warning: HF_TOKEN not set. Llama 3.3 is a gated model." >&2
fi

MODEL="casperhansen/llama-3.3-70b-instruct-awq"

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
