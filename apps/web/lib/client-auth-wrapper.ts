import { isAuthDisabled } from "@/lib/local-auth-vars";
import { DEV_USER } from "@cronicorn/database/dev-user";
import { useSession } from "next-auth/react";

// Client-side auth wrapper
export function useAuthSession() {
	const session = useSession();

	if (isAuthDisabled) {
		return {
			data: {
				user: DEV_USER,
				expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			},
			status: "authenticated" as const,
		};
	}

	return session;
}
