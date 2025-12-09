'use client';

import { useState } from 'react';
import { List, Bookmark, Heart, Clock, MessageSquare } from 'lucide-react';
import MyListsTab from './tabs/MyListsTab';
import BookmarksTab from './tabs/BookmarksTab';
import LikesTab from './tabs/LikesTab';
import RecentActivityTab from './tabs/RecentActivityTab';
import CommentsTab from './tabs/CommentsTab';

type TabType = 'my-lists' | 'bookmarks' | 'likes' | 'comments' | 'recent';

interface ProfileTabsProps {
  userId: string;
}

export default function ProfileTabs({ userId }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('my-lists');

  const tabs = [
    { id: 'my-lists' as TabType, label: 'لیست‌های من', icon: List },
    { id: 'bookmarks' as TabType, label: 'ذخیره‌ها', icon: Bookmark },
    { id: 'likes' as TabType, label: 'لایک‌ها', icon: Heart },
    { id: 'comments' as TabType, label: 'کامنت‌های من', icon: MessageSquare },
    { id: 'recent' as TabType, label: 'فعالیت اخیر', icon: Clock },
  ];

  return (
    <div>
      {/* Tab Buttons */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200 -mx-4 mb-5">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'my-lists' && <MyListsTab userId={userId} />}
        {activeTab === 'bookmarks' && <BookmarksTab userId={userId} />}
        {activeTab === 'likes' && <LikesTab userId={userId} />}
        {activeTab === 'comments' && <CommentsTab userId={userId} />}
        {activeTab === 'recent' && <RecentActivityTab userId={userId} />}
      </div>
    </div>
  );
}

