import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppNavigationProvider, useAppNavigation } from './context/AppNavigationContext';
import { AppDataProvider } from './context/AppDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DevicesScreen } from './screens/DevicesScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { RecordsScreen } from './screens/RecordsScreen';
import { ScanScreen } from './screens/ScanScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { prepareUpdateIfAvailable } from './lib/updates';

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
  const transition = useRef(new Animated.Value(0)).current;

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
    /*
     * 2026-03-27:
     * 启动阶段改成静默检查热更新，不再阻塞首屏进入。
     * 这里仍然提前拉取可用更新，但不自动 reload，避免用户每次打开都先看到更新检查页，
     * 也避免在弱网下把“启动慢”误判成业务卡顿。
     */
    void prepareUpdateIfAvailable();
  }, []);

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
            {route === 'records' ? <RecordsScreen /> : null}
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
              kind="records"
              label="记录"
              active={route === 'records'}
              onPress={() => setRoute('records')}
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
  kind: 'devices' | 'scan' | 'records' | 'profile';
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
  kind: 'devices' | 'scan' | 'records' | 'profile';
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

  if (kind === 'records') {
    return (
      <View style={[styles.glyphClock, { borderColor: theme.icon }, active ? { borderColor: theme.primary } : null]}>
        <View style={[styles.glyphClockHandShort, { backgroundColor: theme.icon }, active ? { backgroundColor: theme.primary } : null]} />
        <View style={[styles.glyphClockHandLong, { backgroundColor: theme.icon }, active ? { backgroundColor: theme.primary } : null]} />
      </View>
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
