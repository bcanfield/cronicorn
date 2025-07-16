"use client";
import useSession from "@/hooks/use-session";
import { signIn, signOut } from "@cronicorn/api/client-auth";

export default function LoginPopup() {
  const { session } = useSession();

  return (
    <>
      {!session ? (
        <div className="flex gap-2">
          <button onClick={() => signIn("github")}>Sign In</button>
        </div>
      ) : (
        <button className="w-full p-0" onClick={() => signOut()}>
          Sign Out
        </button>
      )}
    </>
  );
}
