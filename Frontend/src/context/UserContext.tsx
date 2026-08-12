import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  hasPassword?: boolean;
}

interface UserContextValue {
  user: UserProfile | null;
  loading: boolean;
  setUser: (u: UserProfile | null) => void;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  setUser: () => {},
  refetch: async () => {},
});

async function fetchMe(): Promise<UserProfile | null> {
  const token = sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token');
  if (!token) return null;
  try {
    const res = await fetch('/openwa-api/crm/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      sessionStorage.removeItem('crm_token');
      localStorage.removeItem('crm_token');
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const profile = await fetchMe();
    setUser(profile);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <UserContext.Provider value={{ user, loading, setUser, refetch }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
