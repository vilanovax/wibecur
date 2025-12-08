import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';

const config: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== 'string' || typeof password !== 'string') {
          throw new Error('لطفاً ایمیل و رمز عبور را وارد کنید');
        }

        const user = await prisma.users.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          throw new Error('کاربری با این ایمیل یافت نشد');
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);

        if (!isPasswordValid) {
          throw new Error('رمز عبور اشتباه است');
        }

        // Return minimal user data to keep JWT small
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // Store only essential data in JWT to keep cookie size small
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'wibecur-secret-key-change-in-production-2025',
  // Disable debug to reduce console noise - the chunking warning is not an error
  debug: false,
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);

// For backwards compatibility - alias auth as authOptions
// This allows gradual migration from getServerSession(authOptions) to auth()
export const authOptions = config;
