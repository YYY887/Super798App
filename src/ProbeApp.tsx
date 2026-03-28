import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Linking, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppNavigationProvider, useAppNavigation } from './context/AppNavigationContext';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { parseShortcutUrl, ShortcutAction } from './lib/shortcuts';
import { DevicesScreen } from './screens/DevicesScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ScanScreen } from './screens/ScanScreen';
import { SettingsScreen } from './screens/SettingsScreen';

function AppShell() {
  const { bootstrapped, token, signOut } = useAuth();
  const { theme } = useTheme();

  if (!bootstrapped) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
        <View style={styles.center}>
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Super798 正在启动...</Text>
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
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { route, setRoute } = useAppNavigation();
  const { theme } = useTheme();
  const { loading, devices, setSelectedId, startDrinkingByDeviceId } = useAppData();
  const transition = useRef(new Animated.Value(0)).current;
  const [pendingShortcut, setPendingShortcut] = useState<ShortcutAction | null>(null);
  const shortcutRunningRef = useRef(false);

  useEffect(() => {
    transition.setValue(0);
    Animated.timing(transition, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [route, transition]);

  useEffect(() => {
    let mounted = true;

    async function restoreInitialShortcut() {
      const initialUrl = await Linking.getInitialURL();
      if (!mounted || !initialUrl) return;

      const shortcut = parseShortcutUrl(initialUrl);
      if (!shortcut) return;

      setPendingShortcut(shortcut);
    }

    restoreInitialShortcut();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      const shortcut = parseShortcutUrl(url);
      if (!shortcut) return;

      setPendingShortcut(shortcut);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!pendingShortcut || !token || loading || shortcutRunningRef.current) {
      return;
    }

    if (pendingShortcut.type === 'start') {
      const deviceExists = devices.some((item) => item.id === pendingShortcut.deviceId);

      if (!deviceExists) {
        setPendingShortcut(null);
        Alert.alert('快捷启动失败', '没有找到这个设备，请先确认设备仍在列表里');
        return;
      }

      shortcutRunningRef.current = true;
      setRoute('devices');
      setSelectedId(pendingShortcut.deviceId);

      /*
       * 2026-03-28:
       * 快捷指令拉起 App 时，目标是“进入前台后直接发起启动设备请求”，不要再要求用户
       * 手动点第二次按钮。这里保留设备存在校验和前台切回设备页，后续如果改启动时机，
       * 不能把冷启动场景下的自动执行改没。
       */
      void startDrinkingByDeviceId(pendingShortcut.deviceId).finally(() => {
        shortcutRunningRef.current = false;
        setPendingShortcut(null);
      });
    }
  }, [devices, loading, pendingShortcut, setRoute, setSelectedId, startDrinkingByDeviceId, token]);

  const pageAnimatedStyle = {
    opacity: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [0.58, 1],
    }),
    transform: [
      {
        translateX: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
      {
        translateY: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [6, 0],
        }),
      },
    ],
  };

  if (!token) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
        <View style={[styles.topSafeMask, { backgroundColor: theme.background }]} />
        <LoginScreen />
      </SafeAreaView>
    );
  }

  if (route === 'settings') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
        <View style={[styles.topSafeMask, { backgroundColor: theme.background }]} />
        <SettingsScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <View style={[styles.topSafeMask, { backgroundColor: theme.background }]} />
      <View style={styles.shellBackground} pointerEvents="none">
        <View style={[styles.shellOrb, styles.shellOrbTop, { backgroundColor: theme.primarySoft }]} />
      </View>

      <View style={styles.page}>
        <View style={[styles.pageBody, { paddingBottom: 60 + Math.max(insets.bottom, 8) }]}>
          <Animated.View style={[styles.pageTransition, pageAnimatedStyle]}>
            {route === 'devices' ? <DevicesScreen /> : null}
            {route === 'scan' ? <ScanScreen /> : null}
            {route === 'profile' ? <ProfileScreen /> : null}
          </Animated.View>
        </View>

        <View style={[styles.tabBarWrap, { bottom: Math.max(insets.bottom, 8) }]}>
          <View style={[styles.tabBar, { backgroundColor: theme.tabBar, borderColor: theme.tabBarBorder }]}>
            <TabItem
              kind="devices"
              label="设备"
              active={route === 'devices'}
              onPress={() => setRoute('devices')}
            />
            <TabItem
              kind="scan"
              label="扫码"
              active={route === 'scan'}
              onPress={() => setRoute('scan')}
            />
            <TabItem
              kind="profile"
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
  kind,
  label,
  active,
  onPress,
}: {
  kind: 'devices' | 'scan' | 'profile';
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      style={[
        styles.tabItem,
        kind === 'scan' ? styles.tabItemScan : null,
        active ? styles.tabItemActive : null,
        active ? { backgroundColor: theme.primarySoft, borderColor: theme.primarySoftBorder } : null,
      ]}
      onPress={onPress}
    >
      <View style={styles.glyphWrap}>
        <TabGlyph kind={kind} active={active} />
      </View>
      <Text style={[styles.tabText, { color: theme.icon }, active ? styles.tabTextActive : null, active ? { color: theme.primary } : null]}>{label}</Text>
    </Pressable>
  );
}

function TabGlyph({
  kind,
  active,
}: {
  kind: 'devices' | 'scan' | 'profile';
  active: boolean;
}) {
  const { theme } = useTheme();

  if (kind === 'devices') {
    return (
      <View
        style={[
          styles.glyphDrop,
          { borderColor: theme.icon },
          active ? styles.glyphDropActive : null,
          active ? { borderColor: theme.primary, backgroundColor: theme.primary } : null,
        ]}
      />
    );
  }

  if (kind === 'scan') {
    return (
      <View style={styles.glyphScanWrap}>
        <View style={[styles.glyphScanCorner, styles.glyphScanTopLeft, { borderColor: active ? theme.primary : theme.icon }]} />
        <View style={[styles.glyphScanCorner, styles.glyphScanTopRight, { borderColor: active ? theme.primary : theme.icon }]} />
        <View style={[styles.glyphScanCorner, styles.glyphScanBottomLeft, { borderColor: active ? theme.primary : theme.icon }]} />
        <View style={[styles.glyphScanCorner, styles.glyphScanBottomRight, { borderColor: active ? theme.primary : theme.icon }]} />
        <View style={[styles.glyphScanLine, { backgroundColor: active ? theme.primary : theme.icon }]} />
      </View>
    );
  }

  return (
    <View style={styles.glyphPersonContainer}>
      <View style={[styles.glyphPersonHead, { borderColor: theme.icon }, active ? { borderColor: theme.primary } : null]} />
      <View style={[styles.glyphPersonBody, { borderColor: theme.icon }, active ? { borderColor: theme.primary } : null]} />
    </View>
  );
}

export default function ProbeApp() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f8ff',
  },
  topSafeMask: {
    ...StyleSheet.absoluteFillObject,
    bottom: undefined,
    height: 80,
    backgroundColor: '#f7f8ff',
    zIndex: 1,
  },
  shellBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  shellOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  shellOrbTop: {
    width: 220,
    height: 220,
    top: 72,
    right: -50,
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
    zIndex: 2,
  },
  pageBody: {
    flex: 1,
  },
  pageTransition: {
    flex: 1,
  },
  
  /* --- 导航栏美化部分 --- */
  tabBarWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    // bottom 在组件中动态计算 (考虑安全区)
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(217, 229, 255, 0.9)',
    borderRadius: 32,
    shadowColor: '#90a8cb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 24,
    paddingVertical: 7,
  },
  tabItemScan: {
    flex: 1.08,
  },
  tabItemActive: {
    backgroundColor: 'rgba(208, 236, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(222, 244, 255, 0.95)',
  },
  tabText: { fontSize: 11, fontWeight: '600' },
  tabTextActive: {
    fontWeight: '700',
  },
  glyphWrap: {
    width: 32,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphDrop: {
    width: 14,
    height: 14,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    borderTopRightRadius: 7,
    borderTopLeftRadius: 1, // 尖角
    borderWidth: 2,
    transform: [{ rotate: '45deg' }], // 旋转后尖角朝上，形似水滴或定位
  },
  glyphDropActive: {},

  /* --- 记录 (时钟 图标) --- */
  glyphClock: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
  },
  glyphClockHandShort: {
    position: 'absolute',
    width: 2,
    height: 5,
    borderRadius: 1,
    top: 2,
  },
  glyphClockHandLong: {
    position: 'absolute',
    width: 5,
    height: 2,
    borderRadius: 1,
    top: 6,
    left: 7, // 完美指向 3 点钟方向
  },

  /* --- 我的 (用户 图标) --- */
  glyphPersonContainer: {
    alignItems: 'center',
  },
  glyphScanWrap: {
    width: 22,
    height: 22,
    position: 'relative',
  },
  glyphScanCorner: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  glyphScanTopLeft: {
    top: 1,
    left: 1,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  glyphScanTopRight: {
    top: 1,
    right: 1,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  glyphScanBottomLeft: {
    left: 1,
    bottom: 1,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  glyphScanBottomRight: {
    right: 1,
    bottom: 1,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  glyphScanLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 10,
    height: 2,
    borderRadius: 999,
  },
  glyphPersonHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  glyphPersonBody: {
    marginTop: 2,
    width: 14,
    height: 6,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderWidth: 2,
    borderBottomWidth: 0,
  },
});
