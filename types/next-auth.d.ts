import type { DefaultSession, DefaultUser } from 'next-auth';
import type { Permission } from '@/lib/auth/permissions';

/** رول‌های ادمین برای RBAC */
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'ANALYST' | 'EDITOR';
export type AppRole = 'USER' | AdminRole;

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: AppRole;
      isActive?: boolean;
      adminPermissions?: Permission[];
    };
  }

  interface User extends DefaultUser {
    role?: AppRole;
    isActive?: boolean;
    adminPermissions?: Permission[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: AppRole;
    isActive?: boolean;
    adminPermissions?: Permission[];
  }
}
