'use client';

import { Bell } from 'lucide-react';

export default function HeroGreeting() {
  const userName = 'رام'; // This should come from user context later

  return (
    <section className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            سلام {userName}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            امروز دنبال چی میگردی؟
          </p>
        </div>
        <button className="p-2 relative hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-6 h-6 text-gray-700" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </section>
  );
}

