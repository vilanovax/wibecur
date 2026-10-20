import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import type { AppRole } from '@/types/next-auth';
import type { Permission } from '@/lib/auth/permissions';
import { normalizeAdminPermissions } from '@/lib/auth/has-permission';
import { isAdminRole } from '@/lib/auth/roles';

const config: NextAuthConfig = {
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const identifier = credentials?.phone;
        const password = credentials?.password;

        if (typeof identifier !== 'string' || typeof password !== 'string') {
          return null;
        }

        try {
          const { resolveLoginEmail } = await import('@/lib/phone-auth');
          const email = resolveLoginEmail(identifier);
          if (!email) return null;

          // محدودیت brute-force به‌ازای حساب (نه فقط IP — قابل دور زدن با جعل x-forwarded-for):
          // حداکثر ۱۰ تلاش ناموفق در ۱۵ دقیقه برای هر شناسه.
          const { checkActionRateLimit } = await import('@/lib/rate-limit');
          const { success: underLimit } = await checkActionRateLimit(
            `login:${email}`,
            10,
            '15 m'
          );
          if (!underLimit) return null;

          const { prisma } = await import('@/lib/prisma');
          const { dbQuery } = await import('@/lib/db');
          const user = await dbQuery(() =>
            prisma.users.findUnique({
              where: { email },
            })
          );

          // مقایسهٔ ساختگی هنگام نبودِ کاربر تا کانال جانبی زمان‌بندی (account enumeration) حذف شود.
          const DUMMY_HASH =
            '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Dg.aQH1pOQp8oV.4nq8r9pVf7tF0e';

          const { isAdminRole } = await import('@/lib/auth/roles');
          const { recordAdminLogin } = await import('@/lib/auth/record-admin-login');
          const trackAdmin = async (success: boolean) => {
            if (!user || !isAdminRole(user.role)) return;
            await recordAdminLogin({
              userId: user.id,
              role: user.role,
              success,
              request,
            });
          };

          if (!user || !user.password || !user.isActive || user.deletedAt) {
            bcrypt.compareSync(password, DUMMY_HASH);
            await trackAdmin(false);
            return null;
          }

          const isPasswordValid = bcrypt.compareSync(password, user.password);

          if (!isPasswordValid) {
            await trackAdmin(false);
            return null;
          }

          await trackAdmin(true);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            adminPermissions: normalizeAdminPermissions(user.adminPermissions),
          };
        } catch (err: unknown) {
          const e = err as Error & { code?: string };
          const msg = String(e?.message ?? '');
          const code = e?.code;
          console.error('[auth authorize]', code, msg);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive ?? true;
        token.adminPermissions = user.adminPermissions ?? [];
        if (user.email) token.email = user.email;
      }

      const userId =
        typeof token.id === 'string' ? token.id : typeof token.sub === 'string' ? token.sub : '';
      const tokenRole = typeof token.role === 'string' ? token.role : undefined;
      if (process.env.NEXT_RUNTIME !== 'edge' && userId && isAdminRole(tokenRole)) {
        try {
          const { prisma } = await import('@/lib/prisma');
          const row = await prisma.users.findUnique({
            where: { id: userId },
            select: { role: true, isActive: true, adminPermissions: true, deletedAt: true },
          });
          if (row && !row.deletedAt && isAdminRole(row.role)) {
            token.role = row.role;
            token.isActive = row.isActive;
            token.adminPermissions = normalizeAdminPermissions(row.adminPermissions);
          }
        } catch (error) {
          console.error('[auth jwt refresh]', error);
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (typeof token.id === 'string' ? token.id : token.sub) || '';
        session.user.role = ((token.role as string) || 'USER') as AppRole;
        session.user.isActive = token.isActive !== false;
        session.user.adminPermissions = (token.adminPermissions as Permission[] | undefined) ?? [];
        if (typeof token.email === 'string') {
          session.user.email = token.email;
        }
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAdminRoute = pathname.startsWith('/admin');
      const isProfileRoute = pathname.startsWith('/profile');
      const isProtectedRoute = isAdminRoute || isProfileRoute;
      const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'ANALYST', 'EDITOR'];
      const isAdmin = auth?.user?.role && adminRoles.includes(auth.user.role);
      const isActiveAdmin = auth?.user?.isActive !== false;

      if (!isProtectedRoute) return true;
      if (!auth?.user) return false;
      if (isAdminRoute && (!isAdmin || !isActiveAdmin)) return false;
      return true;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === 'production'
      ? (() => {
          throw new Error('NEXTAUTH_SECRET must be set in production');
        })()
      : 'wibecur-dev-secret'),
  // Disable debug to reduce console noise - the chunking warning is not an error
  debug: false,
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);

// For backwards compatibility - alias auth as authOptions
// This allows gradual migration from getServerSession(authOptions) to auth()
export const authOptions = config;
