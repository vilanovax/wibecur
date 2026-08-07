'use client';

import BaseCommentForm from '@/components/mobile/shared/BaseCommentForm';

interface ListCommentFormProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  listSlug?: string;
  categorySlug?: string | null;
  onSubmit: () => void;
}

export default function ListCommentForm({
  isOpen,
  onClose,
  listId,
  listSlug,
  categorySlug,
  onSubmit,
}: ListCommentFormProps) {
  return (
    <BaseCommentForm
      isOpen={isOpen}
      onClose={onClose}
      apiUrl={`/api/lists/${listId}/comments`}
      onSubmit={onSubmit}
      analytics={{
        target: 'list',
        list_id: listId,
        ...(listSlug ? { list_slug: listSlug } : {}),
        ...(categorySlug ? { category_slug: categorySlug } : {}),
      }}
    />
  );
}

