import { useEffect, useState } from 'react';

export interface SelectionInfo {
  text: string;
  rect: DOMRect;
}

export function useTextSelection(root: HTMLElement | Document | null = document) {
  const [info, setInfo] = useState<SelectionInfo | null>(null);

  useEffect(() => {
    if (!root) return;
    let raf = 0;

    const handleUp = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (!sel || !text || sel.rangeCount === 0) {
          setInfo(null);
          return;
        }
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          setInfo(null);
          return;
        }
        setInfo({ text, rect });
      });
    };

    const handleDown = (e: Event) => {
      const target = e.target as Element | null;
      if (target?.closest('[data-paperlight-popup]')) return;
      setInfo(null);
    };

    const handleKeyEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInfo(null);
    };

    const target = root as Document | HTMLElement;
    target.addEventListener('mouseup', handleUp);
    target.addEventListener('touchend', handleUp as EventListener);
    target.addEventListener('mousedown', handleDown, true);
    document.addEventListener('keydown', handleKeyEsc);

    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener('mouseup', handleUp);
      target.removeEventListener('touchend', handleUp as EventListener);
      target.removeEventListener('mousedown', handleDown, true);
      document.removeEventListener('keydown', handleKeyEsc);
    };
  }, [root]);

  return info;
}
