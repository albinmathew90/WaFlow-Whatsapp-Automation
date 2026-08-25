import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  hasPassword?: boolean;
  subscriptionStatus?: 'active' | 'trial' | 'expired' | string;
  hasUsedTrial?: boolean;
  trialExpiresAt?: string;
  subscriptionExpiresAt?: string;
  planType?: string;
  createdAt?: string;
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

async function fetchMe(): Promise<{ data: UserProfile | null, error?: boolean }> {
  const token = sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token');
  if (!token) return { data: null };
  try {
    const res = await fetch('/openwa-api/crm/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401 || res.status === 403) {
      sessionStorage.removeItem('crm_token');
      localStorage.removeItem('crm_token');
      return { data: null };
    }
    if (!res.ok) {
      // Backend error (502, etc), don't clear tokens, just return error flag
      return { data: null, error: true };
    }
    const data = await res.json();
    return { data };
  } catch {
    return { data: null, error: true };
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const result = await fetchMe();
    if (!result.error) {
      setUser(result.data);
    }
    // Only stop loading if we actually resolved (or failed securely), 
    // otherwise keep whatever state we had.
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
