import type { DefaultSession, NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "@cronicorn/database";
import { env } from "@/env.mjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { isAuthDisabled } from "@/lib/local-auth-vars";
import { DEV_USER } from "@cronicorn/database/dev-user";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
		} & DefaultSession["user"];
	}
}

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		GithubProvider({
			clientId: env.GITHUB_ID ?? "dev-github-id",
			clientSecret: env.GITHUB_SECRET ?? "dev-github-secret",
		}),
	],
	callbacks: {
		session: async ({ session, token }) => {
			if (isAuthDisabled) {
				return {
					...session,
					user: DEV_USER,
					expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
				};
			}
			if (session?.user && token?.sub) {
				session.user.id = token.sub;
			}
			return session;
		},
		jwt: async ({ user, token }) => {
			if (isAuthDisabled) {
				return {
					...token,
					...DEV_USER,
				};
			}
			if (user) {
				token.uid = user.id;
			}
			return token;
		},
	},
	session: {
		strategy: "jwt",
	},
};
