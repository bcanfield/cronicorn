import { authOptions } from "@/lib/auth";
import { isAuthDisabled } from "@/lib/local-auth-vars";
import { DEV_USER } from "@cronicorn/database/dev-user";
import { getServerSession } from "next-auth";

// Server-side auth wrapper
export async function getSession() {
	if (isAuthDisabled) {
		return {
			user: DEV_USER,
			expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
		};
	}

	return await getServerSession(authOptions);
}
