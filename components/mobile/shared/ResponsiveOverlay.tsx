'use client';

import { useIsDesktop, DESKTOP_BREAKPOINT_PX } from '@/lib/hooks/useIsDesktop';
import MobileBottomSheet from './MobileBottomSheet';
import DesktopDialog from './DesktopDialog';

interface ResponsiveOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  maxHeight?: string;
  /** عرض دیالوگ دسکتاپ */
  desktopMaxWidth?: 'sm' | 'md' | 'lg';
  zIndex?: number;
  escapeToClose?: boolean;
  closeOnBackdrop?: boolean;
}

const LG_BREAKPOINT = DESKTOP_BREAKPOINT_PX;

function useIsDesktopOverlay() {
  return useIsDesktop(LG_BREAKPOINT);
}

/**
 * موبایل: BottomSheet | دسکتاپ (lg+): Dialog مرکزی
 */
export default function ResponsiveOverlay({
  isOpen,
  onClose,
  title,
  subtitle,
  headerAction,
  children,
  maxHeight = '85vh',
  desktopMaxWidth = 'md',
  zIndex = 60,
  escapeToClose = true,
  closeOnBackdrop = true,
}: ResponsiveOverlayProps) {
  const isDesktop = useIsDesktopOverlay();

  if (isDesktop) {
    return (
      <DesktopDialog
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        subtitle={subtitle}
        headerAction={headerAction}
        maxWidth={desktopMaxWidth}
        zIndex={zIndex}
        escapeToClose={escapeToClose}
        closeOnBackdrop={closeOnBackdrop}
      >
        <div className="min-h-0">{children}</div>
      </DesktopDialog>
    );
  }

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      headerAction={headerAction}
      maxHeight={maxHeight}
      zIndex={zIndex}
      escapeToClose={escapeToClose}
      closeOnBackdrop={closeOnBackdrop}
    >
      {children}
    </MobileBottomSheet>
  );
}
