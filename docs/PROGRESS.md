# Paperlight — Progress Log

> 마지막 업데이트: 2026-05-18
> 작업 디렉터리: `/Users/bagbogyeong/Desktop/CODE/mine/paperlight-extension`
> GitHub: <https://github.com/bogyungpark/paperlight-extension>

다음 세션에서 이 문서만 읽으면 어디까지 됐고 다음에 뭘 하면 되는지 즉시 파악할 수 있도록 작성됨.

---

## 빠른 재개 가이드

```bash
cd /Users/bagbogyeong/Desktop/CODE/mine/paperlight-extension
git status                      # 미커밋 파일 확인 (아래 "미커밋 작업" 섹션 참고)
npm install                     # 이미 설치돼 있으면 skip
npm run build                   # 빌드 검증 (현재 통과 상태)
```

이어서 STEP 3 끝내기부터 시작. 새 세션에서는 `docs/PROGRESS.md`의 "다음 작업" 섹션부터 보면 됨.

---

## 현재 상태 요약

| STEP | 상태 | 비고 |
| ---- | ---- | ---- |
| 1. 프로젝트 초기화 | ✅ 완료 | commit 2f943e0, push 완료 |
| 2. PDF Viewer MVP | ✅ 완료 | commit e932cf6, push 완료 |
| 3. Selection Popup | ✅ 완료 | commit ea1c61d, push 완료 |
| 4. AI features | ✅ 완료 | commit 11b8ee6, push 완료 |
| 5. Highlights & Notes | ✅ 완료 | IndexedDB(documents+highlights), 4색 highlight, note, sidepanel Highlights 탭 |
| 4. AI features | ⬜ 대기 |  |
| 5. Highlights & Notes | ⬜ 대기 |  |
| 6. Citation preview | ⬜ 대기 |  |
| 7. UI polish | ⬜ 대기 |  |
| 8. Production polish | ⬜ 대기 |  |

빌드: `npm run build` 통과. 타입체크 통과. lint 미실행(설정만 됨).

---

## STEP 1 — 프로젝트 초기화 (완료)

**commit:** `2f943e0 chore: scaffold paperlight extension (vite + react + ts + tailwind + mv3)`

구현한 것:
- Vite 5 + React 18 + TypeScript strict + Tailwind 3 + `@crxjs/vite-plugin` 빌드 파이프라인
- MV3 manifest (`src/manifest.ts`): side panel, background SW, content script, options page, viewer page, context menus, keyboard commands
- 디자인 토큰 기반 Tailwind 테마 (`src/ui/styles/globals.css`) — 다크/라이트, glassmorphism, accent/border/fg 시스템
- 진입점 5개: `sidepanel/`, `viewer/`, `options/`, `background/`, `content/`
- 도구 스크립트: `scripts/copy-pdf-worker.mjs`, `scripts/make-icons.mjs`, `scripts/zip.mjs`
- Brand 아이콘 4종 (16/32/48/128) — node 순수 PNG 생성
- `README.md`, `docs/architecture.md`, `docs/ROADMAP.md`, `LICENSE` (MIT)
- GitHub repo `bogyungpark/paperlight-extension` (public) 생성 + push

---

## STEP 2 — PDF Viewer MVP (완료)

**commit:** `e932cf6 feat: pdf viewer mvp (pdf.js render + text extraction)`

구현한 것:
- `src/pdf/loader.ts` — pdfjs-dist 로더. 워커 URL을 `chrome.runtime.getURL('pdf.worker.min.mjs')`로 해결 (web_accessible_resource)
- `src/pdf/extract.ts` — 페이지별 텍스트 추출, 좌표 기반 줄바꿈 정규화, 헤딩 패턴(Abstract/Introduction/숫자 prefix) 기반 섹션 추론
- `src/pdf/types.ts` — `ParsedDocument` / `PageText` / `PaperSection`
- `src/viewer/PdfPage.tsx` — canvas 렌더 + 투명 TextLayer(pdfjs v4 `TextLayer` 클래스) → 네이티브 선택 가능
- `src/viewer/ViewerApp.tsx` — 드래그/드롭, file picker, `?src=<url>` 인제스트, 줌 50~300%, 멀티페이지 스크롤
- `src/viewer/ViewerToolbar.tsx`, `Outline.tsx` — 툴바 + 섹션 outline
- `src/background/index.ts` 갱신 — `Open current PDF in Paperlight` 컨텍스트 메뉴 + viewer 라우팅 helper

알게 된 것:
- pdfjs-dist v4에선 `renderTextLayer` 헬퍼가 사라지고 `TextLayer` 클래스로 바뀜. `--scale-factor` CSS 변수도 설정해야 폰트 크기가 정확.
- worker는 `public/pdf.worker.min.mjs`로 prebuild 시 복사 (gitignore 처리됨).

---

## STEP 3 — Selection Popup (완료)

**commit:** `feat: selection popup + chat scaffold (floating menu + sidepanel routing)`

구현한 것:
- `src/core/types.ts` — 공유 타입(`AIIntent`, `AIRequestMessage`, `ChatMessage`, `Settings`, `DEFAULT_SETTINGS`)
- `src/core/store/chatStore.ts` · `documentStore.ts` — Zustand 스토어
- `src/core/messaging.ts` — `buildAIRequest`, `dispatchSelectionToSidePanel`, `findPageNumberFromNode` 헬퍼
- `src/ui/hooks/useTextSelection.ts` — React 측 selection 감지 훅 (`{ text, rect }`)
- `src/ui/components/FloatingMenu.tsx` — Explain/Translate/Summarize/Ask AI 버튼, slide-up 애니메이션, 화면 가장자리 자동 반전, Shift+E/T/S/A 키보드 단축키, `data-paperlight-popup`로 외부 클릭 보호
- `src/viewer/ViewerApp.tsx` — useTextSelection + FloatingMenu 마운트, 선택 → `dispatchSelectionToSidePanel` (`pageNumber`는 `data-page` ancestor에서 추출)
- `src/content/index.ts` — 모든 페이지에 Shadow DOM 메뉴 주입(React 없는 순수 TS), `:host { all: initial; }`로 호스트 스타일 격리
- `src/background/index.ts` — `paperlight:open-sidepanel` / `paperlight:ai-request` 수신 시 활성 탭의 side panel을 자동 open
- `src/sidepanel/SidePanelApp.tsx` — `chrome.runtime.onMessage`로 ai-request 수신 → chatStore에 user/assistant 메시지 append, STEP 4가 들어올 때까지는 placeholder echo 응답
- `src/sidepanel/ChatThread.tsx` — 메시지 버블, intent chip, blockquote/볼드/인라인코드만 지원하는 미니 마크다운 렌더러 (XSS 회피 위해 HTML escape 후 인라인 규칙만 적용)
- `src/sidepanel/Composer.tsx` — auto-resize textarea, Enter to send, Shift+Enter 줄바꿈

### 동작 확인 흐름

1. `npm run build` → `dist/` 폴더를 `chrome://extensions`에서 unpacked load
2. 임의 웹 페이지에서 텍스트 드래그 → Shadow DOM 메뉴 표시 → 클릭 시 side panel 열리고 chat에 selection이 user 메시지로 들어감
3. PDF 우클릭 → "Open current PDF in Paperlight" → viewer에서 텍스트 선택 → FloatingMenu → side panel chat
4. AI 응답 자리는 placeholder echo. STEP 4에서 실제 호출로 대체.

---

## STEP 4 — AI features (완료)

**commit:** `feat: ai provider abstraction + streaming chat (openai/anthropic/gemini)`

구현한 것:
- `src/ai/types.ts` — `AIProvider` 인터페이스 (`stream(req, onDelta)`), `ChatTurn`, `ChatRequest`, `ChatResult`, `ProviderError`, `assertOk`
- `src/ai/sse.ts` — 공용 SSE 리더 (`readSseStream`, `readSseEvents`)
- `src/ai/openai.ts` — `/v1/chat/completions` 스트리밍, `data: {...}` 파싱
- `src/ai/anthropic.ts` — `/v1/messages` 스트리밍, `event: content_block_delta` 처리, `anthropic-dangerous-direct-browser-access` 헤더
- `src/ai/gemini.ts` — `:streamGenerateContent?alt=sse` SSE 스트리밍, role: `assistant`→`model` 매핑, systemInstruction 변환
- `src/ai/registry.ts` — settings에서 활성 provider 반환, 키 미설정 시 `ProviderError`
- `src/ai/prompts.ts` — `buildTurns(intent, selection, history, targetLanguage, ...)` 통합 프롬프트 빌더 (intent별 instruction + 컨텍스트 trim 최대 16k chars)
- `src/core/store/settingsStore.ts` — `chrome.storage.local` 동기화, `chrome.storage.onChanged`로 다른 surface에서 변경 시 자동 반영
- `src/sidepanel/hooks/useAIInvoke.ts` — `invoke({ intent, selection, userMessage, ... })` → assistant 메시지 즉시 append → 스트리밍 델타로 `updateMessage`. `cancel()`은 AbortController로 stop
- `src/sidepanel/SidePanelApp.tsx` — placeholder echo 제거, 실제 `invoke()` 호출
- `src/sidepanel/Composer.tsx` — `pending`이면 Stop 버튼 표시, AbortController 통해 즉시 취소
- `src/options/OptionsApp.tsx` — provider 카드, 키 입력(show/hide), 모델/언어 설정, 변경 즉시 storage 저장 + 타임스탬프 표시

검증:
- `npm run build` 통과, 81 modules
- typecheck 통과 (`tsc -b`)
- 키 비어있으면 chat에 빨간색 error로 안내 ("OpenAI API key is empty — set it in Settings.")

주의:
- service worker가 아닌 side panel UI가 직접 fetch — 스트리밍 동안 SW가 죽어도 안전
- Anthropic은 CORS 우회용 헤더 필요. Gemini는 query string `?key=` 방식이라 어떻든 noop

---

## STEP 5 — Highlights & Notes (완료)

**commit:** `feat: highlights + notes (indexeddb persistence + sidepanel tab)`

구현한 것:
- `src/core/storage/db.ts` — IndexedDB v1 (`documents` + `highlights`(index `by_doc`)) + `hashBuffer()` SHA-1
- `src/core/store/highlightStore.ts` — Zustand 스토어, `chrome.storage.local`의 `paperlight:active-document-id`로 viewer ↔ sidepanel 동기화 (`loadActiveDocumentIdFromStorage`, `subscribeActiveDocumentId`)
- `src/viewer/selectionToHighlight.ts` — selection range → 페이지 좌표계 정규화 (`scale`로 나눠 저장, 렌더 시 곱해 복원)
- `src/viewer/HighlightLayer.tsx` — 페이지 위 색상 오버레이, 클릭 시 popover에서 색 변경/노트/삭제
- `src/ui/components/FloatingMenu.tsx` — Explain/Translate/Summarize/Ask AI 옆에 4색 swatch (`onHighlight` prop)
- `src/viewer/ViewerApp.tsx` — `hashBuffer(buf) → putDocument()` + `setHighlightDocId(id)`로 문서 등록, FloatingMenu의 `onHighlight` 연결
- `src/sidepanel/HighlightsPanel.tsx` — 페이지/색/날짜/노트 리스트, 인라인 삭제, 노트 blur 시 저장
- `src/sidepanel/SidePanelApp.tsx` — Chat/Highlights 탭, badge 카운트, active doc id auto-sync

설계 메모:
- documentId = PDF 바이트의 SHA-1 → 같은 PDF를 다시 열어도 highlight 복원됨
- highlight 좌표는 `scale` 함께 저장, 렌더 시 `currentScale / savedScale` 비율로 재투영 → 줌해도 정확히 위치
- viewer/sidepanel은 별도 JS realm이라 store 공유 불가 → `chrome.storage.local`이 IPC 채널 (settings도 같은 패턴)

---

## STEP 6 — Citation preview (대기)

- arxiv/DOI 패턴 감지 → Semantic Scholar Graph API `/paper/search` 또는 `/paper/{id}` 호출
- 결과 캐싱 (`chrome.storage.local`, TTL 24h)
- HoverCard 컴포넌트: title, abstract 200자, year, authors top 3
- 본문 텍스트에서 `[1]`, `[Smith et al., 2024]` 패턴 hover 시 안내

---

## STEP 7 — UI polish (대기)

- shadcn-style Toast, Tooltip, DropdownMenu, Tabs (의존 없이 직접 구현)
- 키보드 단축키: ⌘K (command palette), ⌘⇧L (toggle), ⌘⇧E (explain), j/k (page next/prev), [/] (zoom)
- 다크/라이트/system 토글
- Composer auto-resize, streaming cursor
- 모바일 폭(≥640px)에서 outline 자동 collapse

---

## STEP 8 — Production polish (대기)

- README에 screenshot 4장 (viewer / selection menu / chat / settings)
- `docs/INSTALL.md`, `docs/PRIVACY.md` (key는 로컬 저장만, telemetry 없음)
- `npm run zip` 결과물 검증 후 Web Store 업로드용 준비
- GitHub Actions로 CI (typecheck + build)
- 버전 0.1.0 → 1.0.0 bump + git tag

---

## 미커밋 작업

없음. STEP 3까지 모든 파일이 main에 push 완료.

---

## Git / 환경 메모

- git user: `bogyungpark <pym256@naver.com>` (local config, repo scope)
- gh CLI: 인증됨 (`bogyungpark` 계정)
- node v22.17.1 / npm 10.9.2 (pnpm 미설치 → npm 워크플로우로 진행 결정)
- monorepo는 채택 안 함 — 단일 패키지가 MVP 속도에 더 유리하다고 판단. `src/` 안에 `ai/`, `pdf/`, `core/`, `ui/` 모듈로 논리 분리.

## 빌드 산출물 크기 (참고)

```
dist/pdf.worker.min.mjs            1,375 kB   ← 가장 큼
dist/assets/viewer-*.js              343 kB
dist/assets/globals-*.js (pdf bundle)142 kB
dist/manifest.json                     1.8 kB
```
