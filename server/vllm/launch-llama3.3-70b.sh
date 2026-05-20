#!/usr/bin/env bash
# Meta Llama 3.3 70B Instruct, AWQ 4-bit (community quant), TP=2.
# Note: original Llama is gated on Hugging Face — community AWQ repo below
# is usually open. Export HF_TOKEN if needed.

set -euo pipefail

NAS="${PAPERLIGHT_NAS:-/nas04/data/bgPark/paperlight}"
VENV="$NAS/venv"
PORT="${PORT:-8001}"
export HF_HOME="${HF_HOME:-$NAS/hf-cache}"

if [[ ! -f "$VENV/bin/activate" ]]; then
  echo "venv not found at $VENV. Run vllm/setup.sh first." >&2
  exit 1
fi
# shellcheck disable=SC1091
source "$VENV/bin/activate"

if [[ -z "${HF_TOKEN:-}" ]]; then
  echo "Note: HF_TOKEN not set. If the model is gated, set HF_TOKEN first." >&2
fi

MODEL="casperhansen/llama-3.3-70b-instruct-awq"
echo "==> Launching vLLM"
echo "    model:           $MODEL"
echo "    HF_HOME:         $HF_HOME"
echo "    listening on:    0.0.0.0:$PORT  (/v1)"

exec python -m vllm.entrypoints.openai.api_server \
  --model "$MODEL" \
  --quantization awq_marlin \
  --tensor-parallel-size 2 \
  --gpu-memory-utilization 0.90 \
  --max-model-len 32768 \
  --enable-prefix-caching \
  --host 0.0.0.0 \
  --port "$PORT" \
  --allowed-origins '["chrome-extension://*","moz-extension://*"]'
