import { type ReactNode } from 'react';

export type WibeCardProps = {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md';
};

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4 lg:p-5',
};

export default function WibeCard({
  children,
  className = '',
  padding = 'md',
}: WibeCardProps) {
  return (
    <div
      className={`rounded-2xl border border-wibe/70 bg-wibe-card shadow-sm ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
