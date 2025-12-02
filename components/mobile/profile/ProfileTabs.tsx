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
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
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

