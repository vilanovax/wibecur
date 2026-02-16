import type { DefaultSession, DefaultUser } from 'next-auth';

/** رول‌های ادمین برای RBAC */
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'ANALYST';
export type AppRole = 'USER' | 'EDITOR' | AdminRole;

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: AppRole;
    };
  }

  interface User extends DefaultUser {
    role?: AppRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: AppRole;
  }
}
