'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function Header({ title, showBack = false }: HeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userImage = session?.user?.image;
  const userName = session?.user?.name || session?.user?.email || 'کاربر';

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          {title ? (
            <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
          ) : (
            <h1 className="text-xl font-bold text-primary">WibeCur</h1>
          )}
        </div>
        <Link
          href="/profile"
          className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          {userImage ? (
            <Image
              src={userImage}
              alt={userName}
              width={40}
              height={40}
              className="object-cover w-full h-full"
              unoptimized={true}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white text-sm font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}

