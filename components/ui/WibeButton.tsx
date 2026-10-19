import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type WibeButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type WibeButtonSize = 'sm' | 'md';

export type WibeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: WibeButtonVariant;
  size?: WibeButtonSize;
  children: ReactNode;
};

const variantMap: Record<WibeButtonVariant, 'brand' | 'secondary' | 'ghost' | 'outline'> = {
  primary: 'brand',
  secondary: 'secondary',
  ghost: 'ghost',
  outline: 'outline',
};

/** Consumer button. Same call sites, VibeFarsi paper control underneath. */
export default function WibeButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}: WibeButtonProps) {
  return (
    <Button
      type={type}
      variant={variantMap[variant]}
      size={size}
      className={cn(className)}
      {...props}
    >
      {children}
    </Button>
  );
}
