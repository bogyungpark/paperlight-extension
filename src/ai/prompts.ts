import type { AIIntent, ChatMessage } from '@core/types';
import type { ChatTurn } from './types';

const BASE_SYSTEM = `You are Paperlight, an AI research-paper companion embedded in a Chrome side panel.
- Be concise and precise. Prefer bullet points and numbered lists for clarity.
- Ground every claim in the provided paper context. If the context is insufficient, say so.
- Cite page numbers when you can in the form (p. N). Don't invent citations.
- Format using lightweight markdown: **bold**, _italic_, \`code\`, and > blockquote.`;

const INTENT_PROMPTS: Record<AIIntent, string> = {
  explain: `Explain the passage in clear, accessible language. Define jargon. Compare to common analogues when helpful. Keep it under ~150 words unless the user asks for more.`,
  translate: `Translate the passage faithfully into the user's target language. Preserve technical terms in parentheses next to their translation when ambiguity is likely. Do not add commentary unless asked.`,
  summarize: `Summarize the passage in 3 bullet points: (1) what claim/idea, (2) why it matters, (3) any caveats. Quote at most one short phrase from the source.`,
  chat: `Answer the user's question using the passage and the paper context. Cite page numbers (p. N) when possible.`,
};

export interface BuildTurnsInput {
  intent: AIIntent;
  selection?: string | null;
  userMessage?: string | null;
  documentTitle?: string | null;
  pageNumber?: number | null;
  targetLanguage: string;
  fullContext?: string | null;
  history?: ChatMessage[];
}

export function buildTurns(input: BuildTurnsInput): ChatTurn[] {
  const turns: ChatTurn[] = [];

  const systemParts = [BASE_SYSTEM, `User target language: ${input.targetLanguage}.`];
  if (input.documentTitle) {
    systemParts.push(`The paper opened in Paperlight is titled: "${input.documentTitle}".`);
  }
  systemParts.push(`Intent for this turn: ${input.intent.toUpperCase()}. ${INTENT_PROMPTS[input.intent]}`);
  if (input.fullContext && input.fullContext.length > 0) {
    const trimmed = trimContext(input.fullContext, 16_000);
    systemParts.push(`---\nPaper text (truncated if long):\n${trimmed}`);
  }
  turns.push({ role: 'system', content: systemParts.join('\n\n') });

  // Prior conversation turns (only those with finalized content).
  if (input.history) {
    for (const m of input.history) {
      if (m.pending) continue;
      if (!m.content.trim()) continue;
      if (m.role === 'user' || m.role === 'assistant') {
        turns.push({ role: m.role, content: m.content });
      }
    }
  }

  // Compose the actionable user prompt for this turn.
  const parts: string[] = [];
  if (input.selection) {
    const tag =
      input.pageNumber != null ? `Selected passage from page ${input.pageNumber}:` : `Selected passage:`;
    parts.push(`${tag}\n"""\n${input.selection.trim()}\n"""`);
  }
  if (input.userMessage) parts.push(input.userMessage.trim());
  if (parts.length === 0) parts.push(`Please ${input.intent} the selected passage.`);
  turns.push({ role: 'user', content: parts.join('\n\n') });

  return turns;
}

function trimContext(text: string, max: number): string {
  if (text.length <= max) return text;
  const head = text.slice(0, Math.floor(max * 0.6));
  const tail = text.slice(-Math.floor(max * 0.3));
  return `${head}\n\n…[truncated for length]…\n\n${tail}`;
}
