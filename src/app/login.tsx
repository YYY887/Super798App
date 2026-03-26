import { Redirect } from 'expo-router';

import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';

export default function LoginRoute() {
  const { bootstrapped, token } = useAuth();

  if (!bootstrapped) return null;
  if (token) return <Redirect href="/(tabs)" />;

  return <LoginScreen />;
}
