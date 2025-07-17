import { useQuery } from "@tanstack/react-query";

const SESSION_QUERY_KEY = ["session"];
const useSession = () => {
  const { data, status } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/session`
      );
      return res.json();
    },
    staleTime: 5 * (60 * 1000),
    gcTime: 10 * (60 * 1000),
    refetchOnWindowFocus: true,
  });
  return { session: data, status };
};

export default useSession;
