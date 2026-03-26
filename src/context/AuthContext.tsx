import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { clearStoredToken, getStoredToken, setStoredToken } from '../lib/storage';

type AuthContextValue = {
  bootstrapped: boolean;
  token: string;
  signIn: (nextToken: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    let mounted = true;

    async function restoreToken() {
      const storedToken = await getStoredToken();
      if (!mounted) return;

      setToken(storedToken ?? '');
      setBootstrapped(true);
    }

    restoreToken();

    return () => {
      mounted = false;
    };
  }, []);

  async function signIn(nextToken: string) {
    await setStoredToken(nextToken);
    setToken(nextToken);
  }

  async function signOut() {
    await clearStoredToken();
    setToken('');
  }

  return (
    <AuthContext.Provider
      value={{
        bootstrapped,
        token,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
