'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  href?: string;
  linkText?: string;
}

export default function SectionHeader({
  title,
  href,
  linkText = 'همه',
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 mb-4">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-primary text-sm font-medium flex items-center gap-1 hover:text-primary-dark transition-colors"
        >
          {linkText}
          <ChevronLeft className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

