"use client";
import LoginPopup from "@/components/login-popup";
import {
  cronicornApiClient,
  jobsApiClient,
  usersApiClient,
} from "@/lib/api-clients";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await usersApiClient.index.$get();
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });
  const {
    data: jobs,
    isLoading: isLoadingJobs,
    error: jobsError,
  } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const response = await jobsApiClient.index.$get();
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const {
    data: messages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const response = await cronicornApiClient.index.$get();
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
  });
  return (
    <div className="flex flex-col">
      <LoginPopup />
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      {isLoadingMessages && <p>Loading...</p>}
      {messagesError && (
        <p className="text-red-500">Error: {messagesError.message}</p>
      )}
      <ul className="list-disc pl-5">
        {messages?.map((message, index) => (
          <li key={index} className="mb-2">
            {JSON.stringify(message)}
          </li>
        ))}
      </ul>
      <hr />

      <h1 className="text-2xl font-bold mb-4">Users</h1>
      {isLoadingUsers && <p>Loading...</p>}
      {usersError && (
        <p className="text-red-500">Error: {usersError.message}</p>
      )}
      <ul className="list-disc pl-5">
        {users?.map((user) => (
          <li key={user.id} className="mb-2">
            {user.name} ({user.email})
          </li>
        ))}
      </ul>
      <hr />
      <h1 className="text-2xl font-bold mb-4">Jobs</h1>
      {isLoadingJobs && <p>Loading...</p>}
      {jobsError && <p className="text-red-500">Error: {jobsError.message}</p>}
      <ul className="list-disc pl-5">
        {jobs?.map((job) => (
          <li key={job.id} className="mb-2">
            {job.id} - {job.definitionNL}
          </li>
        ))}
      </ul>
    </div>
  );
}
