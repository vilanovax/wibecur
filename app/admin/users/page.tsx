import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/admin/shared/Pagination';
import { UserRole } from '@prisma/client';

const ITEMS_PER_PAGE = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; role?: string }>;
}) {
  await requireAdmin();

  const { page = '1', role } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const where = role && role !== 'all' ? { role: role as UserRole } : {};

  const [totalCount, users, stats] = await Promise.all([
    prisma.users.count({ where }),
    prisma.users.findMany({
      skip,
      take: ITEMS_PER_PAGE,
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    // Get user stats in parallel
    Promise.all(
      (await prisma.users.findMany({
        where,
        skip,
        take: ITEMS_PER_PAGE,
        select: { id: true },
      })).map(async (user) => {
        const [listsCount, likesCount, bookmarksCount] = await Promise.all([
          prisma.lists.count({ where: { userId: user.id } }),
          prisma.list_likes.count({ where: { userId: user.id } }),
          prisma.bookmarks.count({ where: { userId: user.id } }),
        ]);
        return {
          userId: user.id,
          listsCount,
          likesCount,
          bookmarksCount,
        };
      })
    ),
  ]);

  // Create stats map
  const statsMap = new Map(
    stats.map((stat) => [stat.userId, stat])
  );

  const usersWithStats = users.map((user) => ({
    ...user,
    ...(statsMap.get(user.id) || { listsCount: 0, likesCount: 0, bookmarksCount: 0 }),
  }));

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const roleLabels: Record<UserRole, string> = {
    USER: 'کاربر',
    EDITOR: 'ویرایشگر',
    ADMIN: 'مدیر',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">مدیریت کاربران</h1>
        <div className="flex gap-3">
          {/* Role Filter */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <a
              href="/admin/users?role=all"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !role || role === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              همه
            </a>
            {Object.entries(roleLabels).map(([roleValue, label]) => (
              <a
                key={roleValue}
                href={`/admin/users?role=${roleValue}`}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  role === roleValue
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                کاربر
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                ایمیل
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                نقش
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                آمار
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                تاریخ عضویت
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                وضعیت
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {usersWithStats.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {(user.name || user.email)[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.name || 'بدون نام'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'EDITOR'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex gap-4">
                    <span>📋 {user.listsCount || 0}</span>
                    <span>❤️ {user.likesCount || 0}</span>
                    <span>⭐ {user.bookmarksCount || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      user.emailVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {user.emailVerified ? 'تایید شده' : 'در انتظار تایید'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/users"
        searchParams={role ? { role } : {}}
      />
    </div>
  );
}
