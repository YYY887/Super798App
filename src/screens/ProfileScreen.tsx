import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppNavigation } from '../context/AppNavigationContext';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';

export function ProfileScreen() {
  const { theme } = useTheme();
  const { signOut } = useAuth();
  const { setRoute } = useAppNavigation();
  const { account, devices } = useAppData();

  async function handleLogout() {
    await signOut();
    setRoute('login');
  }

  function handleOpenSettings() {
    setRoute('settings');
  }

  function handleComingSoon() {
    // 先占位，后续真正接设置页时直接替换这里的跳转逻辑。
    alert('敬请期待');
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>我的</Text>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            {account?.img ? (
              <Image source={{ uri: account.img }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: theme.surfaceSoft }]}>
                <Text style={[styles.avatarFallbackText, { color: theme.primary }]}>{account?.name?.slice(0, 1) || '用'}</Text>
              </View>
            )}

            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, { color: theme.text }]}>{account?.name || '-'}</Text>
              <Text style={[styles.heroPhone, { color: theme.textMuted }]}>{account?.pn || '-'}</Text>
              <Text style={[styles.heroHint, { color: theme.textSoft }]}>Super798 用户中心</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={[styles.heroStatItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.heroStatLabel, { color: theme.textMuted }]}>设备</Text>
              <Text style={[styles.heroStatValue, { color: theme.primary }]}>{devices.length}</Text>
            </View>
            <View style={[styles.heroStatItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.heroStatLabel, { color: theme.textMuted }]}>积分</Text>
              <Text style={[styles.heroStatValue, { color: theme.primary }]}>{account?.useScore ?? 0}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.menuGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable style={styles.menuItem} onPress={handleOpenSettings}>
            <View>
              <Text style={[styles.menuTitle, { color: theme.text }]}>设置</Text>
              <Text style={[styles.menuHint, { color: theme.textMuted }]}>通知、权限和更多配置</Text>
            </View>
            <Text style={[styles.menuArrow, { color: theme.textSoft }]}>›</Text>
          </Pressable>

          <Pressable style={styles.menuItem} onPress={handleComingSoon}>
            <View>
              <Text style={[styles.menuTitle, { color: theme.text }]}>消息中心</Text>
              <Text style={[styles.menuHint, { color: theme.textMuted }]}>系统通知和账户提醒</Text>
            </View>
            <Text style={[styles.menuArrow, { color: theme.textSoft }]}>›</Text>
          </Pressable>

          <Pressable style={styles.menuItem} onPress={handleComingSoon}>
            <View>
              <Text style={[styles.menuTitle, { color: theme.text }]}>关于 Super798</Text>
              <Text style={[styles.menuHint, { color: theme.textMuted }]}>版本信息与功能说明</Text>
            </View>
            <Text style={[styles.menuArrow, { color: theme.textSoft }]}>›</Text>
          </Pressable>
        </View>

        <Pressable style={[styles.logoutButton, { backgroundColor: theme.dangerStrong }]} onPress={handleLogout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f8ff' },
  content: { paddingHorizontal: 18, paddingTop: 18, gap: 14 },
  title: { fontSize: 28, color: '#22325c', fontWeight: '800' },
  subtitle: { fontSize: 13, color: '#6f7db4' },
  heroCard: {
    gap: 18,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eef2ff',
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#4d63df',
    fontSize: 28,
    fontWeight: '800',
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  heroName: {
    fontSize: 26,
    color: '#22325c',
    fontWeight: '800',
  },
  heroPhone: {
    fontSize: 15,
    color: '#6f7db4',
  },
  heroHint: {
    fontSize: 12,
    color: '#97a3d0',
    fontWeight: '600',
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStatItem: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e8ff',
    padding: 14,
    gap: 6,
  },
  heroStatLabel: {
    fontSize: 12,
    color: '#6f7db4',
  },
  heroStatValue: {
    fontSize: 22,
    color: '#4d63df',
    fontWeight: '800',
  },
  menuGroup: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e4e8ff',
  },
  menuItem: {
    minHeight: 68,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0,
  },
  menuTitle: {
    fontSize: 16,
    color: '#22325c',
    fontWeight: '700',
  },
  menuHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#6f7db4',
  },
  menuArrow: {
    fontSize: 22,
    color: '#9aa7d9',
    fontWeight: '400',
    marginLeft: 12,
  },
  statValue: { fontSize: 20, color: '#000000', fontWeight: '800' },
  logoutButton: {
    marginTop: 6,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#5c74f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
