import { createContext, ReactNode, useContext, useState } from 'react';

export type AppRoute = 'login' | 'devices' | 'scan' | 'records' | 'profile' | 'settings';

type AppNavigationContextValue = {
  route: AppRoute;
  setRoute: (route: AppRoute) => void;
};

const AppNavigationContext = createContext<AppNavigationContextValue | null>(null);

export function AppNavigationProvider({
  children,
  initialRoute,
}: {
  children: ReactNode;
  initialRoute: AppRoute;
}) {
  const [route, setRoute] = useState<AppRoute>(initialRoute);

  return (
    <AppNavigationContext.Provider value={{ route, setRoute }}>
      {children}
    </AppNavigationContext.Provider>
  );
}

export function useAppNavigation() {
  const context = useContext(AppNavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within AppNavigationProvider');
  }

  return context;
}
