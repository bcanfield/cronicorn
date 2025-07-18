"use client";
import { signIn, signOut, useSession } from "@cronicorn/api/client-auth";

export default function SignInOrOutButton() {
  const { data: session } = useSession();

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
