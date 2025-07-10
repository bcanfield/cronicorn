"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const response = await api.stats.$get()

      if (!response.ok) {
        throw new Error("Failed to fetch stats")
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useMetrics() {
  return useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const response = await api.metrics.$get()

      if (!response.ok) {
        throw new Error("Failed to fetch metrics")
      }

      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
