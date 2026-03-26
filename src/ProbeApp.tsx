import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AppNavigationProvider, useAppNavigation } from './context/AppNavigationContext';
import { AppDataProvider } from './context/AppDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DevicesScreen } from './screens/DevicesScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { RecordsScreen } from './screens/RecordsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

function AppShell() {
  const { bootstrapped, token, signOut } = useAuth();

  if (!bootstrapped) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Super798 正在启动...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AppNavigationProvider initialRoute={token ? 'devices' : 'login'}>
      <AppDataProvider token={token} onExpired={signOut}>
        <Navigator />
      </AppDataProvider>
    </AppNavigationProvider>
  );
}

function Navigator() {
  const { token } = useAuth();
  const { route, setRoute } = useAppNavigation();

  if (!token) {
    return <LoginScreen />;
  }

  if (route === 'settings') {
    return <SettingsScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.pageBody}>
          {route === 'devices' ? <DevicesScreen /> : null}
          {route === 'records' ? <RecordsScreen /> : null}
          {route === 'profile' ? <ProfileScreen /> : null}
        </View>

        <View style={styles.tabBarWrap}>
          <View style={styles.tabBar}>
            <TabItem
              label="设备"
              active={route === 'devices'}
              onPress={() => setRoute('devices')}
            />
            <TabItem
              label="记录"
              active={route === 'records'}
              onPress={() => setRoute('records')}
            />
            <TabItem
              label="我的"
              active={route === 'profile'}
              onPress={() => setRoute('profile')}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function TabItem({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tabItem, active ? styles.tabItemActive : null]} onPress={onPress}>
      <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

export default function ProbeApp() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f8fc',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#35526f',
    fontWeight: '600',
  },
  page: {
    flex: 1,
  },
  pageBody: {
    flex: 1,
  },
  tabBarWrap: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: '#d8e7f6',
  },
  tabItem: {
    flex: 1,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: '#dfefff',
  },
  tabText: {
    fontSize: 14,
    color: '#7c8da3',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#214c7a',
    fontWeight: '800',
  },
});
