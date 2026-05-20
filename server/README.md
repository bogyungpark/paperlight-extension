# Paperlight inference server

Self-hosted OpenAI-compatible inference for the Paperlight Chrome extension.

- **Hardware**: NVIDIA RTX A6000 × 2 (48 GB each, 96 GB total)
- **Runtime policy**: Paperlight runs on **a single GPU** (`CUDA_VISIBLE_DEVICES=0`).
  The second card is left free for other workloads.
- **Reference host**: `bgPark@192.168.110.106`
- **Server path**: `/home1/bgPark/CODE/paperlight`
- **Default runtime**: Ollama (vLLM is also provided as a faster alternative)

> ⚠️ **No commands here are executed automatically.** This folder is purely
> source / configuration. The owner of the GPU box runs the launchers when
> they decide. Read each section before running anything.

---

## Quick start — Ollama (default, single GPU)

```bash
ssh bgPark@192.168.110.106
cd /home1/bgPark/CODE/paperlight

# 1) one-time install + systemd drop-in (CUDA_VISIBLE_DEVICES=0, CORS, LAN bind)
bash ollama/setup.sh

# 2) restart the daemon yourself once the drop-in is in place
sudo systemctl restart ollama
sudo systemctl status ollama --no-pager      # expect 'active (running)'

# 3) pull a model — Qwen 2.5 32B fits comfortably in 48 GB:
ollama pull qwen2.5:32b-instruct-q4_K_M

# (or stretch one card to its limit:)
# ollama pull qwen2.5:72b-instruct-q4_K_M     # ~40 GB

# 4) verify GPU usage is on card 0 only
nvidia-smi
```

Paperlight client settings (in the extension's options page):

```
Provider:           OpenAI
OpenAI API key:     (leave blank)
OpenAI base URL:    http://192.168.110.106:11434/v1
OpenAI model:       qwen2.5:32b-instruct-q4_K_M
```

Smoke test from your laptop:

```bash
bash smoke-test.sh
# or with the 72B model:
PL_MODEL=qwen2.5:72b-instruct-q4_K_M bash smoke-test.sh
```

## Alternative — vLLM (faster, AWQ, prefix caching)

Kept in the tree so you can switch later without re-uploading anything.
Even though A6000 × 2 makes tensor-parallel attractive, the launchers
here can also be pinned to one GPU.

```bash
cd /home1/bgPark/CODE/paperlight
bash vllm/setup.sh                           # venv + pip
tmux new -s vllm
CUDA_VISIBLE_DEVICES=0 bash vllm/launch-qwen32b-awq.sh
# (Single-GPU launch. Detach with Ctrl-b d.)
```

Paperlight client base URL becomes `http://192.168.110.106:8000/v1`,
and the model name is `Qwen/Qwen2.5-32B-Instruct-AWQ`.

> The dual-GPU TP=2 launchers (`launch-qwen72b-awq.sh`,
> `launch-llama3.3-70b.sh`) are kept around for the day you want to use
> both cards — they're not the default and won't be started by anything
> automatically.

## Layout

```
paperlight/
├── README.md                          ← this file
├── models.md                          ← recommended models + pull/download
├── smoke-test.sh                      ← curl /v1/chat/completions verification
├── ollama/                            ← default runtime
│   ├── setup.sh                       ← installs ollama + systemd drop-in
│   └── ollama-paperlight.conf         ← CUDA_VISIBLE_DEVICES=0, CORS, LAN bind
└── vllm/                              ← alternative runtime
    ├── setup.sh                       ← venv + pip install (no GPU touched)
    ├── launch-qwen32b-awq.sh          ← single GPU
    ├── launch-qwen72b-awq.sh          ← TP=2 (uses both cards)
    └── launch-llama3.3-70b.sh         ← TP=2 (Llama, gated on HF)
```

## Switching which GPU Ollama uses

Edit `ollama/ollama-paperlight.conf`, change `CUDA_VISIBLE_DEVICES=0`
to `CUDA_VISIBLE_DEVICES=1`, then:

```bash
sudo cp ollama/ollama-paperlight.conf /etc/systemd/system/ollama.service.d/paperlight.conf
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

To temporarily use both GPUs, comment the `CUDA_VISIBLE_DEVICES` line out.

## Networking

Ollama binds to `0.0.0.0:11434` via the drop-in. Make sure the GPU host's
firewall permits inbound traffic on `11434` from the client subnet only.

See `../docs/LOCAL_LLM.md` in the main repo for the client-side wiring.
