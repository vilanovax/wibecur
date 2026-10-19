import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import ListsPageContentSkeleton from '@/components/mobile/lists/ListsPageContentSkeleton';

/** همان اسکلت داخل صفحه، تا تعویض loading به محتوا پرش ندهد. */
export default function ListsLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header title="لیست‌ها" hideTitleOnDesktop hideOnDesktop showDesktopSearch={false} />
      <main className="min-w-0 flex-1 pt-2 lg:pt-0">
        <ListsPageContentSkeleton />
      </main>
      <BottomNav />
    </div>
  );
}
