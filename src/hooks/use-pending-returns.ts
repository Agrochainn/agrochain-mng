import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/constants";

async function getPendingReturnsCount(): Promise<number> {
  try {
    const response = await apiClient.get<{ success: boolean; count: number }>(
      API_ENDPOINTS.RETURNS.COUNT_PENDING
    );
    return response.data.count || 0;
  } catch (error) {
    console.error("Error fetching pending returns count:", error);
    return 0;
  }
}

export function usePendingReturnsCount() {
  return useQuery({
    queryKey: ["pending-returns-count"],
    queryFn: getPendingReturnsCount,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });
}
