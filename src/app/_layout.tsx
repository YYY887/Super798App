import { Stack } from 'expo-router';

import { AppDataProvider } from '../context/AppDataContext';
import { AuthProvider, useAuth } from '../context/AuthContext';

function RootStack() {
  const { token, signOut } = useAuth();

  return (
    <AppDataProvider token={token} onExpired={signOut}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
      </Stack>
    </AppDataProvider>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <RootStack />
    </AuthProvider>
  );
}
