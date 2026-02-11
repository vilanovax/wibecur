import type { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: 'USER' | 'ADMIN' | 'EDITOR';
    };
  }

  interface User extends DefaultUser {
    role?: 'USER' | 'ADMIN' | 'EDITOR';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'USER' | 'ADMIN' | 'EDITOR';
  }
}
