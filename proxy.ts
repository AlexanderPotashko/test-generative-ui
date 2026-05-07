import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Edge-compatible config (no DB, no Node.js APIs)
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};
