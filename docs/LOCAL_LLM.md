# Self-hosted LLM with Paperlight

Paperlight can talk to any **OpenAI-compatible** inference server. This means you can host a strong open model on your own GPU and use it instead of paying OpenAI / Anthropic / Google.

The reference setup below targets:

- **GPU server**: NVIDIA RTX A6000 (48 GB VRAM) at `192.168.110.110` on your LAN
- **Client**: Chrome on your MacBook (M4) in the same network
- **Server software**: [Ollama](https://ollama.com) — one-line install, OpenAI-compatible at `/v1`

If you already prefer **vLLM** or **LM Studio**, the wiring on the Paperlight side is identical — only the base URL changes.

---

## 1. Pick a model

For an A6000 (48 GB) the sweet spot for paper reading is one of:

| Model                                  | Quant       | VRAM use | Notes                                         |
| -------------------------------------- | ----------- | -------- | --------------------------------------------- |
| **Qwen 2.5 32B Instruct** ⭐            | FP16        | ~64 GB ❌ — pick 8-bit | gold standard if you have room |
| **Qwen 2.5 32B Instruct (AWQ 4-bit)**  | AWQ         | ~18 GB   | tons of headroom, very fast                   |
| **Qwen 2.5 72B Instruct (AWQ 4-bit)**  | AWQ         | ~38 GB   | best quality that fits an A6000               |
| **Llama 3.3 70B Instruct (Q4_K_M)**    | GGUF Q4_K_M | ~40 GB   | strong general reasoning, 128k context        |
| **DeepSeek-R1 Distill Qwen 32B**       | Q4_K_M      | ~18 GB   | math / chain-of-thought specialist            |

Default recommendation: **Qwen 2.5 72B AWQ** for max quality, or **Qwen 2.5 32B AWQ** for snappier responses.

---

## 2. Install Ollama on the GPU server

SSH into `192.168.110.110` and run:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Ollama installs as a systemd service. Pull a model:

```bash
ollama pull qwen2.5:32b-instruct-q4_K_M     # ~18 GB download
# or:
ollama pull llama3.3:70b-instruct-q4_K_M    # ~40 GB
```

---

## 3. Allow LAN access + CORS

By default Ollama binds to `127.0.0.1` and rejects browser origins. Override via systemd drop-in:

```bash
sudo systemctl edit ollama.service
```

Paste:

```
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_ORIGINS=chrome-extension://*,moz-extension://*"
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

Verify from your Mac:

```bash
curl http://192.168.110.110:11434/v1/models
# expect a JSON list including qwen2.5:32b-instruct-q4_K_M
```

> **`OLLAMA_ORIGINS=*`** also works while testing, but the explicit
> `chrome-extension://*` pattern is what you want long-term so other browsers
> on your network can't poke at the API.

---

## 4. Wire it up in Paperlight

1. Open Paperlight side panel → ⚙️ → **Settings**
2. Provider section: keep **OpenAI** selected (Ollama speaks the OpenAI dialect)
3. **OpenAI API key**: leave blank
4. **Models → OpenAI model**: type the exact model name Ollama reports —
   e.g. `qwen2.5:32b-instruct-q4_K_M`
5. **Local / self-hosted server → OpenAI base URL**:

   ```
   http://192.168.110.110:11434/v1
   ```

6. Open a PDF → drag-select → **Explain** — the streamed reply now comes from your A6000.

---

## 5. Smoke test

If something looks off, this is the single most useful command:

```bash
curl -N http://192.168.110.110:11434/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "qwen2.5:32b-instruct-q4_K_M",
    "stream": true,
    "messages": [{"role":"user","content":"Hello from Paperlight"}]
  }'
```

You should see SSE chunks (`data: {…}`). If yes, Paperlight will too.

---

## 6. Tradeoffs vs. cloud providers

| Concern              | Local (Ollama / vLLM)                            | Cloud (OpenAI / Anthropic / Gemini)        |
| -------------------- | ------------------------------------------------ | ------------------------------------------ |
| Cost per token       | **Free** (electricity)                           | $0.075 – $5 per 1M tokens                  |
| Privacy              | **Never leaves your LAN**                        | Sent to the provider                       |
| Quality (top-tier)   | Qwen 72B / Llama 70B ≈ GPT-4o-mini · below o3    | Frontier models available                  |
| First-token latency  | ~200 ms on LAN                                   | ~500–1500 ms across the public internet    |
| Long context (128k+) | Yes                                              | Yes (but pricier)                          |
| Multimodal           | Limited — depends on model (Qwen2-VL, LLaVA, …)  | First-class (GPT-4o, Claude vision)        |

For paper reading specifically, **a self-hosted Qwen 2.5 72B is within striking distance of GPT-4o-mini**, easily good enough for explain / translate / summarize / QA in Paperlight.

---

## 7. Alternative servers (same Paperlight setup)

### vLLM (faster throughput, multi-user friendly)

```bash
pip install vllm
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-32B-Instruct-AWQ \
  --host 0.0.0.0 --port 8000 \
  --allowed-origins '["chrome-extension://*"]'
```

Paperlight base URL: `http://192.168.110.110:8000/v1`

### LM Studio (GUI on the server)

Start the local server tab → "Enable CORS" → copy the listed URL into Paperlight.
