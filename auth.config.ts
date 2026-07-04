import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (no database / bcrypt imports) so it can be used inside
 * middleware. The Credentials provider (which needs Prisma) is added in auth.ts,
 * which only runs in the Node.js runtime.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const needsAuth =
        path.startsWith("/account") ||
        path.startsWith("/onboarding") ||
        path === "/events/new" ||
        path === "/orgs/new" ||
        /^\/events\/[^/]+\/(manage|check-in)/.test(path) ||
        /^\/orgs\/[^/]+\/manage/.test(path);

      if (needsAuth && !isLoggedIn) return false; // → redirect to /login
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.username = (user as { username?: string }).username;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.username) session.user.username = token.username as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
