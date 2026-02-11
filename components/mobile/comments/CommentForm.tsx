'use client';

import BaseCommentForm from '@/components/mobile/shared/BaseCommentForm';

interface CommentFormProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  onSubmit: () => void;
}

export default function CommentForm({
  isOpen,
  onClose,
  itemId,
  onSubmit,
}: CommentFormProps) {
  return (
    <BaseCommentForm
      isOpen={isOpen}
      onClose={onClose}
      apiUrl={`/api/items/${itemId}/comments`}
      onSubmit={onSubmit}
    />
  );
}

