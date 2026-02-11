'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NotificationIcon from './NotificationIcon';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export default function Header({ title, showBack = false }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const userImage = session?.user?.image;
  const userName = session?.user?.name || session?.user?.email || 'کاربر';
  const isHome = pathname === '/';

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors"
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
        <div className="flex items-center gap-2 flex-shrink-0">
          {session?.user && <NotificationIcon />}
          {!isHome && (
            <Link
              href="/user-lists"
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 hover:bg-gray-200 transition-colors"
              title="لیست‌های من"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            </Link>
          )}
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
      </div>
    </header>
  );
}

