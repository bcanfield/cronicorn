"use client";
import SignInOrOutButton from "@/components/login-popup";
import { jobsApiClient, usersApiClient } from "@/lib/api-clients";
import { useSession } from "@cronicorn/api/client-auth";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // redirect to dashboard if logged in
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  return (
    <div className="flex flex-col">
      <h1>Home Page</h1>
    </div>
  );
}
