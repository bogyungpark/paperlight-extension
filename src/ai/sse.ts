// Minimal SSE readers. The OpenAI flavor emits `data: <json>` per chunk;
// Anthropic wraps each chunk in an `event: <name>\n data: <json>\n\n` block.

export async function* readSseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith('data:')) continue;
      yield line.slice(5).trim();
    }
  }
}

export interface SseEvent {
  event: string;
  data: string;
}

export async function* readSseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      let evt = 'message';
      const dataLines: string[] = [];
      for (const raw of block.split('\n')) {
        const line = raw.trim();
        if (line.startsWith('event:')) evt = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
      }
      if (dataLines.length > 0) yield { event: evt, data: dataLines.join('\n') };
    }
  }
}
