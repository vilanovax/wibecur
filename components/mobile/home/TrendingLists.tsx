'use client';

import ListCard from '@/components/mobile/home/ListCard';
import SectionHeader from '@/components/mobile/home/SectionHeader';

// Mock data - will be replaced with real data later
const mockLists = [
  {
    id: '1',
    title: 'بهترین فیلم‌های عاشقانه ۲۰۲۵',
    description: 'لیست کامل فیلم‌های عاشقانه سال ۲۰۲۵ که باید ببینی',
    coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=200&fit=crop',
    badge: 'trending' as const,
    itemCount: 10,
    saves: 89,
    likes: 234,
  },
  {
    id: '2',
    title: 'بهترین کافه‌های روباز تهران',
    description: 'کافه‌های دنج و زیبا برای یک عصر دل‌انگیز در تهران',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=200&fit=crop',
    badge: 'featured' as const,
    itemCount: 15,
    saves: 156,
    likes: 421,
  },
  {
    id: '3',
    title: 'بهترین کتاب‌های ۵ سال اخیر',
    description: 'کتاب‌های برتر از سال ۲۰۲۰ تا ۲۰۲۵ که باید بخوانی',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=200&fit=crop',
    itemCount: 20,
    saves: 203,
    likes: 567,
  },
];

export default function TrendingLists() {
  return (
    <section className="mb-8">
      <SectionHeader title="لیست‌های ترند" href="/lists" />
      <div className="px-4 space-y-4">
        {mockLists.map((list) => (
          <ListCard key={list.id} {...list} />
        ))}
      </div>
    </section>
  );
}
