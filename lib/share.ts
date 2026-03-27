interface ShareOptions {
  title: string;
  text?: string;
  url?: string;
}

/**
 * Share via Web Share API or fall back to clipboard copy.
 * Returns true if the link was copied to clipboard (so callers can show a toast).
 */
export async function shareOrCopy({ title, text, url }: ShareOptions): Promise<boolean> {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text: text || title, url: shareUrl });
      return false;
    } catch {
      // User cancelled or share failed — fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(shareUrl);
    return true;
  } catch {
    return false;
  }
}
