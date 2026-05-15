import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { PageText, ParsedDocument, PaperSection } from './types';

const HEADING_REGEX =
  /^(abstract|introduction|related work|background|method(?:s|ology)?|approach|experiments?|evaluation|results?|discussion|conclusions?|limitations?|references?|appendix|acknowledg(?:e)?ments?)\b/i;

const NUMBERED_HEADING_REGEX = /^(\d+(?:\.\d+)*)[.)\s]+([A-Z][A-Za-z0-9 \-:'/&]+)$/;

function normalizeWhitespace(text: string): string {
  return text.replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
}

export async function extractPageText(doc: PDFDocumentProxy, pageNumber: number): Promise<string> {
  const page = await doc.getPage(pageNumber);
  const content = await page.getTextContent();
  let lastY: number | undefined;
  const buf: string[] = [];
  for (const raw of content.items) {
    const item = raw as TextItem;
    if (!('str' in item)) continue;
    const transform = item.transform;
    const y = transform?.[5];
    if (lastY !== undefined && y !== undefined && Math.abs(lastY - y) > 2) {
      buf.push('\n');
    }
    buf.push(item.str);
    if (!item.hasEOL) buf.push(' ');
    lastY = y;
  }
  page.cleanup();
  return normalizeWhitespace(buf.join('').trim());
}

export async function extractDocument(doc: PDFDocumentProxy): Promise<ParsedDocument> {
  const numPages = doc.numPages;
  const pages: PageText[] = [];
  for (let i = 1; i <= numPages; i++) {
    pages.push({ pageNumber: i, text: await extractPageText(doc, i) });
  }
  const fullText = pages.map((p) => p.text).join('\n\n');
  const meta = await doc.getMetadata().catch(() => null);
  const rawInfo = meta?.info as { Title?: string } | undefined;
  const title = rawInfo?.Title?.trim() || inferTitle(pages[0]?.text ?? '');
  const sections = inferSections(pages);
  return { numPages, pages, fullText, title, sections };
}

function inferTitle(firstPage: string): string | null {
  const lines = firstPage.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 6)) {
    if (line.length > 12 && line.length < 200 && /[A-Za-z]/.test(line) && !/@/.test(line)) {
      return line;
    }
  }
  return null;
}

function inferSections(pages: PageText[]): PaperSection[] {
  const result: PaperSection[] = [];
  let current: PaperSection | null = null;
  for (const { pageNumber, text } of pages) {
    const lines = text.split('\n');
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const heading = matchHeading(line);
      if (heading) {
        if (current) {
          current.endPage = pageNumber;
          result.push(current);
        }
        current = {
          title: heading.title,
          level: heading.level,
          startPage: pageNumber,
          endPage: pageNumber,
          text: '',
        };
      } else if (current) {
        current.text += line + '\n';
      }
    }
  }
  if (current) {
    current.endPage = pages.at(-1)?.pageNumber ?? current.startPage;
    result.push(current);
  }
  return result;
}

function matchHeading(line: string): { title: string; level: number } | null {
  if (line.length > 80) return null;
  const numbered = NUMBERED_HEADING_REGEX.exec(line);
  if (numbered) {
    const dots = (numbered[1].match(/\./g) ?? []).length;
    return { title: `${numbered[1]} ${numbered[2]}`.trim(), level: 1 + dots };
  }
  if (HEADING_REGEX.test(line)) {
    return { title: line, level: 1 };
  }
  return null;
}
