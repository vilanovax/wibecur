'use client';

import BaseCommentForm from '@/components/mobile/shared/BaseCommentForm';

interface ListCommentFormProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  onSubmit: () => void;
}

export default function ListCommentForm({
  isOpen,
  onClose,
  listId,
  onSubmit,
}: ListCommentFormProps) {
  return (
    <BaseCommentForm
      isOpen={isOpen}
      onClose={onClose}
      apiUrl={`/api/lists/${listId}/comments`}
      onSubmit={onSubmit}
    />
  );
}

