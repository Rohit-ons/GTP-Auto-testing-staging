import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        // Reject inactive users
        if (!user.isActive) {
          return null;
        }

        // Track last login time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id?: string; role?: string; name?: string | null; email?: string | null };
        token.id = u.id;
        token.role = u.role;
        token.name = u.name;
        token.email = u.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as { id?: string; role?: unknown; name?: string | null; email?: string | null };
        sessionUser.id = token.id as string;
        sessionUser.role = token.role;
        sessionUser.name = token.name as string;
        sessionUser.email = token.email as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
  }
};
