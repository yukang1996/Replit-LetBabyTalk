import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Check for guest user in localStorage
  const guestUser = localStorage.getItem('guestUser');
  const parsedGuestUser = guestUser ? JSON.parse(guestUser) : null;

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !parsedGuestUser, // Only fetch if not a guest user
  });

  // Use guest user if available, otherwise use authenticated user
  const currentUser = parsedGuestUser || user;
  const isAuthenticated = !!(parsedGuestUser || user);

  return {
    user: currentUser,
    isLoading: parsedGuestUser ? false : isLoading,
    isAuthenticated,
    isGuest: !!parsedGuestUser,
  };
}
