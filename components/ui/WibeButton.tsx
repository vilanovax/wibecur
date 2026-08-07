import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type WibeButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type WibeButtonSize = 'sm' | 'md';

export type WibeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: WibeButtonVariant;
  size?: WibeButtonSize;
  children: ReactNode;
};

const variantClasses: Record<WibeButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
  secondary: 'bg-wibe-surface text-foreground hover:bg-gray-100 border border-wibe',
  ghost: 'bg-transparent text-wibe-secondary hover:bg-wibe-surface hover:text-foreground',
  outline: 'bg-wibe-card text-primary border border-primary/25 hover:bg-primary/5',
};

const sizeClasses: Record<WibeButtonSize, string> = {
  sm: 'h-8 px-3 wibe-caption',
  md: 'h-10 px-4 wibe-small',
};

export default function WibeButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...props
}: WibeButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-fast ease-vibe disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
