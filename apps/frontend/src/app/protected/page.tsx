"use client";
export const dynamic = "force-dynamic";

import { SessionProvider } from "@cronicorn/api/client-auth";

export default function ProtectedPage() {
  return (
    <div className="flex flex-col">
      <SessionProvider>
        <p>Protected</p>
      </SessionProvider>
    </div>
  );
}
