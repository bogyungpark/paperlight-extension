# Paperlight inference server

Self-hosted OpenAI-compatible inference for the Paperlight Chrome extension.

- **Hardware**: NVIDIA RTX A6000 × 2 (48 GB each, 96 GB total)
- **Reference host**: `bgPark@192.168.110.106` (no sudo on this account)
- **Code path**: `/home1/bgPark/CODE/paperlight` (sparse-checkout of `dev_server`)
- **Storage path (venv + model cache)**: `/nas04/data/bgPark/paperlight` (NAS, 26 TB free)
- **Default runtime**: **vLLM** (no `sudo` needed, best A6000 throughput)
- **Alternative**: Ollama — kept here only as a fallback when `sudo` is available

> ⚠️ **No commands here are executed automatically.** This folder is purely
> source / configuration. The owner of the GPU box runs the launchers when
> they decide. Read each section before running anything.

---

## Quick start — vLLM (default, no sudo)

Why vLLM as default: the Ollama installer writes to `/usr/local` and needs
`sudo`. The reference operator account isn't in sudoers, and `/usr` is also
intentionally out of bounds. vLLM, in contrast, lives entirely inside a
user-owned venv on the NAS, so it slots into the operator's environment
without touching anything system-wide.

### 0. Get the latest code
```bash
ssh bgPark@192.168.110.106
cd ~/CODE/paperlight
git pull
```

### 1. One-time setup
```bash
cd ~/CODE/paperlight/server
bash vllm/setup.sh
# creates /nas04/data/bgPark/paperlight/{venv,hf-cache}
# pip-installs vllm into that venv (~1.2 GB wheel)
```

### 2. Launch a model (foreground — use tmux)
```bash
tmux new -s vllm
cd ~/CODE/paperlight/server
bash vllm/launch-qwen32b-awq.sh        # Qwen 2.5 32B AWQ, single GPU
# Detach: Ctrl-b, d
```

vLLM downloads the model from Hugging Face into `/nas04/data/bgPark/paperlight/hf-cache`
on first launch (~18 GB for the 32B AWQ build). Subsequent launches reuse it.

### 3. Smoke test from your laptop
```bash
cd ~/Desktop/CODE/mine/paperlight-extension/server
PL_URL=http://192.168.110.106:8000/v1 \
PL_MODEL=Qwen/Qwen2.5-32B-Instruct-AWQ \
  bash smoke-test.sh
```

You should see `data: {…}` chunks. If yes, Paperlight will too.

### 4. Wire up the Chrome extension
Open the side panel ⚙️ and set:
```
Provider:           OpenAI
OpenAI API key:     (leave blank)
OpenAI base URL:    http://192.168.110.106:8000/v1
OpenAI model:       Qwen/Qwen2.5-32B-Instruct-AWQ
```

## Choosing a model

| Launcher                          | Model                              | Quant | GPUs |
| --------------------------------- | ---------------------------------- | ----- | ---- |
| `launch-qwen32b-awq.sh` (default) | Qwen/Qwen2.5-32B-Instruct-AWQ      | AWQ-4 | 1    |
| `launch-qwen72b-awq.sh`           | Qwen/Qwen2.5-72B-Instruct-AWQ      | AWQ-4 | 2 (TP=2) |
| `launch-llama3.3-70b.sh`          | casperhansen/llama-3.3-70b-instruct-awq | AWQ-4 | 2 (TP=2) |

See `models.md` for more options.

## Switching which GPU vLLM uses

The 32B launcher honours `CUDA_VISIBLE_DEVICES` (defaults to `0`):
```bash
CUDA_VISIBLE_DEVICES=1 bash vllm/launch-qwen32b-awq.sh   # use the second GPU
```
The 72B / Llama launchers use both GPUs by design (TP=2).

## Storage layout

```
/nas04/data/bgPark/paperlight/
├── venv/        ← Python venv (vllm + deps; ~5 GB)
└── hf-cache/    ← downloaded model weights (HF_HOME); 18–80 GB depending on choice
```

Override the root with `PAPERLIGHT_NAS=/some/other/path` if you ever want to
relocate.

## Fallback — Ollama (only if you have sudo)

Kept in `ollama/` for completeness. Requires sudo to run the official
installer and to drop the systemd override into place. If you do have sudo:

```bash
bash ollama/setup.sh
sudo systemctl restart ollama
ollama pull qwen2.5:32b-instruct-q4_K_M
# Paperlight base URL: http://192.168.110.106:11434/v1
```

## Layout

```
paperlight/server/
├── README.md                          ← this file
├── models.md                          ← recommended models + HF repos / Ollama tags
├── smoke-test.sh                      ← curl /v1/chat/completions verification
├── vllm/                              ← default runtime
│   ├── setup.sh                       ← venv + pip install (no GPU touched)
│   ├── launch-qwen32b-awq.sh          ← single GPU
│   ├── launch-qwen72b-awq.sh          ← TP=2 (both A6000s)
│   └── launch-llama3.3-70b.sh         ← TP=2 (Llama, may be gated on HF)
└── ollama/                            ← fallback (needs sudo)
    ├── setup.sh
    └── ollama-paperlight.conf
```

## Networking

- vLLM binds to `0.0.0.0:8000` and serves the `/v1` OpenAI surface.
- CORS is opened to `chrome-extension://*` and `moz-extension://*` so the
  Paperlight extension can call it directly.
- If a firewall is in front of the GPU host, allow inbound `8000/tcp` from
  the client subnet only.

See `../docs/LOCAL_LLM.md` in the main repo for the client-side wiring.
