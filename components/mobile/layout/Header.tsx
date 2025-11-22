'use client';

import Link from 'next/link';

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="px-4 py-4 flex items-center justify-between">
        {title ? (
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        ) : (
          <h1 className="text-xl font-bold text-primary">WibeCur</h1>
        )}
        <Link
          href="/profile"
          className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </Link>
      </div>
    </header>
  );
}

