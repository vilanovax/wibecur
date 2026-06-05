'use client';

import { useEffect } from 'react';
import type { CommentRowData } from '@/components/admin/comments/CommentRow';

function isTypingTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  );
}

type Options = {
  enabled: boolean;
  comments: CommentRowData[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

export function useCommentsKeyboardShortcuts({
  enabled,
  comments,
  selectedId,
  onSelectId,
  onApprove,
  onReject,
}: Options) {
  useEffect(() => {
    if (!enabled || comments.length === 0) return;

    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const idx = selectedId
        ? comments.findIndex((c) => c.id === selectedId)
        : -1;

      const key = e.key.toLowerCase();

      if (key === 'j') {
        e.preventDefault();
        const next = idx < comments.length - 1 ? idx + 1 : 0;
        onSelectId(comments[next].id);
        return;
      }
      if (key === 'k') {
        e.preventDefault();
        const prev = idx > 0 ? idx - 1 : comments.length - 1;
        onSelectId(comments[prev].id);
        return;
      }

      const id = selectedId ?? comments[0]?.id;
      if (!id) return;
      const comment = comments.find((c) => c.id === id);
      if (!comment?.deletedAt) {
        if (key === 'a') {
          e.preventDefault();
          onApprove(id);
        } else if (key === 'r') {
          e.preventDefault();
          onReject(id);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, comments, selectedId, onSelectId, onApprove, onReject]);
}
