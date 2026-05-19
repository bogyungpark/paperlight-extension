# Model recommendations (A6000 × 2, 96 GB)

Picks are tuned for **research paper reading** (long context + reasoning).

## Ollama tags

```bash
# Default — Qwen 2.5 72B, AWQ 4-bit equivalent in Ollama
ollama pull qwen2.5:72b-instruct-q4_K_M       # ~40 GB, fits on one A6000

# Smaller / snappier (also a great first try)
ollama pull qwen2.5:32b-instruct-q4_K_M       # ~18 GB

# Meta Llama 3.3 70B
ollama pull llama3.3:70b-instruct-q4_K_M      # ~40 GB

# DeepSeek R1 distill — chain-of-thought, math, proofs
ollama pull deepseek-r1:32b                   # ~20 GB

# Phi-4 — strong reasoning at 14B
ollama pull phi4:14b                          # ~9 GB
```

After pulling, the model name shown by `ollama list` is exactly what
Paperlight expects in **Settings → Models → OpenAI model**.

## vLLM repos (Hugging Face)

vLLM downloads the weights from HF the first time you launch a model.
Make sure you've accepted the model license on the HF page and have
`HF_TOKEN` exported if the model is gated.

| Repo                                            | Quant   | VRAM (per GPU, TP=2) |
| ----------------------------------------------- | ------- | -------------------- |
| `Qwen/Qwen2.5-72B-Instruct-AWQ`                 | AWQ-4   | ~20 GB               |
| `Qwen/Qwen2.5-32B-Instruct-AWQ`                 | AWQ-4   | ~10 GB               |
| `meta-llama/Llama-3.3-70B-Instruct`             | fp16    | ~70 GB (TP=2 splits) |
| `casperhansen/llama-3.3-70b-instruct-awq`       | AWQ-4   | ~20 GB               |
| `deepseek-ai/DeepSeek-R1-Distill-Qwen-32B`      | fp16    | ~64 GB (TP=2)        |
| `Qwen/Qwen2.5-14B-Instruct`                     | fp16    | ~28 GB               |

## When in doubt

For Paperlight specifically:

- **Best quality** → Qwen 2.5 72B (Ollama Q4_K_M, or vLLM AWQ)
- **Snappiest** → Qwen 2.5 32B AWQ
- **Reasoning-heavy questions** → DeepSeek R1 Distill 32B

You can keep multiple pulled at once — Ollama lazy-loads each into VRAM only when called.
