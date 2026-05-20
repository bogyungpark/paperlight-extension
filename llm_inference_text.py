#!/usr/bin/env python3
"""Quick standalone tester for the Paperlight self-hosted LLM endpoint.

Default target is the vLLM server on the lab GPU box. Override with --url /
--model, or via PAPERLIGHT_URL / PAPERLIGHT_MODEL environment variables —
the script speaks plain OpenAI-compatible /v1/chat/completions, so it also
works against OpenAI proper, Ollama, LM Studio, etc.

Zero third-party dependencies — uses only the Python standard library so
you can drop it onto any machine with Python 3.8+ and run it immediately.

Examples
--------

# one-shot
    python llm_inference_text.py "이 논문의 핵심 contribution이 뭐야?"

# with a system prompt and a tighter temperature
    python llm_inference_text.py \\
        -s "You are a meticulous research-paper assistant." \\
        -t 0.2 \\
        "Explain Mixture of Experts in 3 sentences"

# multi-turn chat REPL
    python llm_inference_text.py -i

# point at a different endpoint (e.g. another lab host or OpenAI proper)
    PAPERLIGHT_URL=https://api.openai.com/v1 \\
    PAPERLIGHT_MODEL=gpt-4o-mini \\
    OPENAI_API_KEY=sk-... \\
        python llm_inference_text.py "hi"

# list which models the endpoint exposes
    python llm_inference_text.py --list-models
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Iterator, List, Mapping

DEFAULT_URL = os.environ.get(
    "PAPERLIGHT_URL", "http://192.168.110.106:8001/v1"
)
DEFAULT_MODEL = os.environ.get(
    "PAPERLIGHT_MODEL", "Qwen/Qwen2.5-32B-Instruct-AWQ"
)
DEFAULT_SYSTEM = (
    "You are Paperlight, a precise research-paper assistant. "
    "Answer concisely. Default to Korean unless the user writes in another language."
)


def _auth_headers() -> Mapping[str, str]:
    # Local servers (vLLM / Ollama) accept any bearer token but the header
    # must be valid syntax. If the caller has set OPENAI_API_KEY we use that
    # so the same script also works against the real OpenAI API.
    key = os.environ.get("OPENAI_API_KEY") or "local"
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {key}",
    }


def list_models(url: str) -> None:
    req = urllib.request.Request(
        f"{url.rstrip('/')}/models", headers=_auth_headers(), method="GET"
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    for entry in body.get("data", []):
        print(entry.get("id"))


def stream_chat(
    url: str,
    model: str,
    messages: List[dict],
    temperature: float,
    max_tokens: int,
    stream: bool,
) -> Iterator[str]:
    payload = {
        "model": model,
        "messages": messages,
        "stream": stream,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{url.rstrip('/')}/chat/completions",
        data=body,
        headers=_auth_headers(),
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            if not stream:
                obj = json.loads(resp.read().decode("utf-8"))
                content = (
                    obj.get("choices", [{}])[0].get("message", {}).get("content", "")
                )
                if content:
                    yield content
                return

            for raw in resp:
                line = raw.decode("utf-8", errors="replace").strip()
                if not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if not data or data == "[DONE]":
                    continue
                try:
                    obj = json.loads(data)
                except json.JSONDecodeError:
                    continue
                delta = (
                    obj.get("choices", [{}])[0].get("delta", {}).get("content")
                )
                if delta:
                    yield delta
    except urllib.error.HTTPError as e:
        sys.stderr.write(
            f"\nHTTP {e.code} {e.reason} from {url}\n"
            f"{e.read().decode('utf-8', errors='replace')[:500]}\n"
        )
        sys.exit(2)
    except urllib.error.URLError as e:
        sys.stderr.write(f"\nrequest failed: {e}\n")
        sys.exit(2)


def run_oneshot(args: argparse.Namespace, prompt: str) -> None:
    messages = [
        {"role": "system", "content": args.system},
        {"role": "user", "content": prompt},
    ]

    start = time.monotonic()
    chars = 0
    for chunk in stream_chat(
        args.url, args.model, messages, args.temperature, args.max_tokens, not args.no_stream
    ):
        sys.stdout.write(chunk)
        sys.stdout.flush()
        chars += len(chunk)
    elapsed = time.monotonic() - start
    sys.stdout.write("\n")
    if args.timing:
        rate = chars / elapsed if elapsed > 0 else 0
        sys.stderr.write(
            f"\n— {chars} chars in {elapsed:.2f}s ({rate:.0f} ch/s)\n"
        )


def run_interactive(args: argparse.Namespace) -> None:
    print(f"Paperlight LLM tester — {args.model} @ {args.url}")
    print("Type 'exit', 'quit', or Ctrl-D to leave. 'reset' clears the history.\n")
    messages: List[dict] = [{"role": "system", "content": args.system}]
    while True:
        try:
            user = input("you ▸ ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return
        if not user:
            continue
        if user in {"exit", "quit"}:
            return
        if user == "reset":
            messages = [{"role": "system", "content": args.system}]
            print("(history cleared)\n")
            continue

        messages.append({"role": "user", "content": user})
        sys.stdout.write("ai  ▸ ")
        sys.stdout.flush()
        reply_parts: List[str] = []
        for chunk in stream_chat(
            args.url, args.model, messages, args.temperature, args.max_tokens, True
        ):
            sys.stdout.write(chunk)
            sys.stdout.flush()
            reply_parts.append(chunk)
        sys.stdout.write("\n\n")
        messages.append({"role": "assistant", "content": "".join(reply_parts)})


def main() -> None:
    p = argparse.ArgumentParser(
        description=(
            "Standalone client for the Paperlight LLM endpoint "
            "(OpenAI-compatible /v1/chat/completions)."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument(
        "prompt",
        nargs="?",
        help="user prompt; if omitted, reads from stdin (unless -i is given)",
    )
    p.add_argument(
        "-s", "--system", default=DEFAULT_SYSTEM, help="system prompt"
    )
    p.add_argument(
        "-u",
        "--url",
        default=DEFAULT_URL,
        help=f"base URL of the OpenAI-compatible endpoint (default: {DEFAULT_URL})",
    )
    p.add_argument(
        "-m",
        "--model",
        default=DEFAULT_MODEL,
        help=f"model id as the endpoint reports it (default: {DEFAULT_MODEL})",
    )
    p.add_argument(
        "-t", "--temperature", type=float, default=0.3, help="sampling temperature"
    )
    p.add_argument(
        "-n", "--max-tokens", type=int, default=512, help="max tokens to generate"
    )
    p.add_argument(
        "-i", "--interactive", action="store_true", help="multi-turn REPL"
    )
    p.add_argument(
        "--no-stream",
        action="store_true",
        help="wait for the full response, then print",
    )
    p.add_argument(
        "--timing",
        action="store_true",
        help="print elapsed time and char/s after the response",
    )
    p.add_argument(
        "--list-models",
        action="store_true",
        help="GET /v1/models and exit",
    )
    args = p.parse_args()

    if args.list_models:
        list_models(args.url)
        return

    if args.interactive:
        run_interactive(args)
        return

    if args.prompt is not None:
        prompt = args.prompt
    elif not sys.stdin.isatty():
        prompt = sys.stdin.read()
    else:
        p.error(
            "no prompt provided. Pass it as an argument, pipe via stdin, "
            "or use -i for interactive mode."
        )

    if not prompt.strip():
        p.error("empty prompt")

    run_oneshot(args, prompt)


if __name__ == "__main__":
    main()
