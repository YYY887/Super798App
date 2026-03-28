import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '../../context/AuthContext';

export default function TabsLayout() {
  const { bootstrapped, token } = useAuth();

  if (!bootstrapped) return null;
  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f86c6',
        tabBarInactiveTintColor: '#93a4bd',
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderTopColor: '#d8e7f6',
          height: 58,
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '设备',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
        }}
      />
    </Tabs>
  );
}
