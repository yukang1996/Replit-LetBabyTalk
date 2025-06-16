import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export function useAuth() {
  // Check for guest user in localStorage
  const guestUser = localStorage.getItem('guestUser');
  const parsedGuestUser = guestUser ? JSON.parse(guestUser) : null;

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !parsedGuestUser, // Only fetch if not a guest user
  });

  // Use guest user if available, otherwise use authenticated user
  const currentUser = parsedGuestUser || user;
  const isAuthenticated = !!(parsedGuestUser || user);

  const refetchAuth = async () => {
    // Clear guest user and refetch
    localStorage.removeItem('guestUser');
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    await refetch();
  };

  return {
    user: currentUser,
    isLoading: parsedGuestUser ? false : isLoading,
    isAuthenticated,
    isGuest: !!parsedGuestUser,
    refetch: refetchAuth,
  };
}
