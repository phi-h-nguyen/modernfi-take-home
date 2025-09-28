import { useQuery } from "@tanstack/react-query";
import { API_URL } from "../types/api";
import type { OrdersResponse } from "../types/api";

const fetchOrders = async (): Promise<OrdersResponse> => {
  const response = await fetch(`${API_URL}/api/orders`);
  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.statusText}`);
  }
  return response.json();
};

export const useOrderData = () => {
  return useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
