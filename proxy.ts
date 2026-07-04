import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Route protection is enforced by the `authorized` callback in auth.config.ts.
export default NextAuth(authConfig).auth;

export const config = {
  // Run on everything except static assets and Next internals.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
