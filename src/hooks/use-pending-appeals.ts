import { useQuery } from "@tanstack/react-query";
import appealService from "@/lib/services/appeal-service";

export function usePendingAppealsCount() {
  return useQuery({
    queryKey: ["pending-appeals-count"],
    queryFn: () => appealService.getPendingAppealsCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });
}
