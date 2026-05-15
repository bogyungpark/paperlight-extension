export interface PageText {
  pageNumber: number;
  text: string;
}

export interface PaperSection {
  title: string;
  level: number;
  startPage: number;
  endPage: number;
  text: string;
}

export interface ParsedDocument {
  numPages: number;
  pages: PageText[];
  fullText: string;
  title: string | null;
  sections: PaperSection[];
}
