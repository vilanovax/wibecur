'use client';

import ResponsiveOverlay from './ResponsiveOverlay';
import type { MobileBottomSheetProps } from './MobileBottomSheet';

export type BottomSheetProps = MobileBottomSheetProps & {
  desktopMaxWidth?: 'sm' | 'md' | 'lg' | 'xl';
};

/**
 * موبایل: Bottom sheet | دسکتاپ (lg+): Dialog
 */
export default function BottomSheet({
  desktopMaxWidth = 'md',
  ...props
}: BottomSheetProps) {
  return <ResponsiveOverlay desktopMaxWidth={desktopMaxWidth} {...props} />;
}
