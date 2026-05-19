# Paperlight inference server

Self-hosted OpenAI-compatible inference for the Paperlight Chrome extension.

- **Target hardware**: NVIDIA RTX A6000 × 2 (96 GB total VRAM)
- **Reference host**: `bgPark@192.168.110.106`
- **Server path**: `/home1/bgPark/CODE/paperlight`
- **Client**: Paperlight extension, base URL pointed at this server

> ⚠️ **No commands here are executed automatically.** This folder is purely
> source / configuration. The owner of the GPU box runs the launchers when
> they decide. Read each section before running anything.

## Pick a flavor

| Server | When to pick                                          | Strengths                                                  |
| ------ | ----------------------------------------------------- | ---------------------------------------------------------- |
| Ollama | Easiest setup, casual single-user use                 | One command, swap models in seconds, OpenAI-compatible      |
| vLLM   | You want best throughput / batching / tensor-parallel | Faster, multi-GPU aware, AWQ / GPTQ kernels                 |

If unsure → **Ollama**.

## Quick start (Ollama)

```bash
cd /home1/bgPark/CODE/paperlight
bash ollama/setup.sh             # one-time install + systemd override

# pick a model from models.md, e.g.:
ollama pull qwen2.5:72b-instruct-q4_K_M

# Paperlight Settings → Provider: OpenAI, base URL:
#   http://192.168.110.106:11434/v1
# OpenAI model: qwen2.5:72b-instruct-q4_K_M
```

## Quick start (vLLM, dual-GPU tensor parallel)

```bash
cd /home1/bgPark/CODE/paperlight
bash vllm/setup.sh                # one-time venv + install
bash vllm/launch-qwen72b-awq.sh   # foreground server on :8000

# Paperlight Settings → Provider: OpenAI, base URL:
#   http://192.168.110.106:8000/v1
# OpenAI model: Qwen/Qwen2.5-72B-Instruct-AWQ
```

## Layout

```
paperlight/
├── README.md                          ← this file
├── models.md                          ← recommended models + pull/download commands
├── ollama/
│   ├── setup.sh                       ← installs ollama + writes systemd override
│   └── ollama-paperlight.conf         ← systemd drop-in: bind 0.0.0.0 + CORS
├── vllm/
│   ├── setup.sh                       ← venv + pip install (no GPU touched)
│   ├── launch-qwen72b-awq.sh          ← TP=2, AWQ, 128k context, OpenAI server
│   ├── launch-qwen32b-awq.sh          ← single GPU, snappier responses
│   └── launch-llama3.3-70b.sh         ← Meta Llama 3.3 70B GPTQ
└── smoke-test.sh                      ← curl /v1/chat/completions to verify
```

## Networking

The Paperlight extension is loaded into Chrome under a fixed
`chrome-extension://<id>` origin. Both server options below allow that
origin via CORS — Ollama through `OLLAMA_ORIGINS=chrome-extension://*`,
vLLM through `--allowed-origins`.

Make sure the GPU host's firewall permits inbound traffic on the chosen
port (`11434` for Ollama, `8000` for vLLM) from the client subnet only.

See `../docs/LOCAL_LLM.md` in the main repo for the client-side wiring.
