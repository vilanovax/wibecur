import { type ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    <Card className={cn(paddingClasses[padding], className)}>
      {children}
    </Card>
  );
}
