import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from '../context/AppNavigationContext';
import { useTheme } from '../context/ThemeContext';
import { applyPreparedUpdate, prepareUpdateIfAvailable } from '../lib/updates';

export function SettingsScreen() {
  const { setRoute } = useAppNavigation();
  const { isDark, setIsDark, theme } = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  function handleComingSoon() {
    alert('敬请期待');
  }

  async function handleCheckUpdate() {
    const result = await prepareUpdateIfAvailable();

    if (result.status === 'available') {
      Alert.alert('发现新版本', '新版本已经准备好，立即重启更新。', [
        {
          text: '立即更新',
          onPress: () => {
            void applyPreparedUpdate();
          },
        },
      ]);
      return;
    }

    Alert.alert('检查更新', result.message);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => setRoute('profile')}>
            <Text style={[styles.backText, { color: theme.primary }]}>返回</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>设置</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.item, styles.itemLast, { borderBottomColor: theme.border }]}>
            <View style={styles.itemTextWrap}>
              <Text style={[styles.itemTitle, { color: theme.text }]}>暗色模式</Text>
              <Text style={[styles.itemHint, { color: theme.textMuted }]}>夜间观感更柔和</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={setIsDark}
              trackColor={{ false: theme.switchTrackOff, true: theme.actionBlue }}
              thumbColor={theme.switchThumb}
            />
          </View>
        </View>

        <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable style={styles.item} onPress={handleComingSoon}>
            <View style={styles.itemTextWrap}>
              <Text style={[styles.itemTitle, { color: theme.text }]}>桌面小组件</Text>
              <Text style={[styles.itemHint, { color: theme.textMuted }]}>敬请期待</Text>
            </View>
            <Text style={[styles.arrow, { color: theme.textSoft }]}>›</Text>
          </Pressable>
        </View>

        <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable style={[styles.item, { borderBottomColor: theme.borderSoft }]} onPress={handleComingSoon}>
            <View style={styles.itemTextWrap}>
              <Text style={[styles.itemTitle, { color: theme.text }]}>通知设置</Text>
              <Text style={[styles.itemHint, { color: theme.textMuted }]}>消息提醒和系统通知</Text>
            </View>
            <Text style={[styles.arrow, { color: theme.textSoft }]}>›</Text>
          </Pressable>

          <Pressable style={[styles.item, { borderBottomColor: theme.borderSoft }]} onPress={handleComingSoon}>
            <View style={styles.itemTextWrap}>
              <Text style={[styles.itemTitle, { color: theme.text }]}>相机权限</Text>
              <Text style={[styles.itemHint, { color: theme.textMuted }]}>扫码、拍照和访问权限</Text>
            </View>
            <Text style={[styles.arrow, { color: theme.textSoft }]}>›</Text>
          </Pressable>

          <Pressable style={styles.item} onPress={handleComingSoon}>
            <View style={styles.itemTextWrap}>
              <Text style={[styles.itemTitle, { color: theme.text }]}>隐私与安全</Text>
              <Text style={[styles.itemHint, { color: theme.textMuted }]}>账号安全和隐私说明</Text>
            </View>
            <Text style={[styles.arrow, { color: theme.textSoft }]}>›</Text>
          </Pressable>
        </View>

        <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable style={[styles.item, { borderBottomColor: theme.borderSoft }]} onPress={handleCheckUpdate}>
            <View style={styles.itemTextWrap}>
              <Text style={[styles.itemTitle, { color: theme.text }]}>检查更新</Text>
              <Text style={[styles.itemHint, { color: theme.textMuted }]}>当前版本 {version}</Text>
            </View>
            <Text style={[styles.arrow, { color: theme.primary }]}>›</Text>
          </Pressable>

          <Pressable style={[styles.item, { borderBottomColor: theme.borderSoft }]} onPress={handleComingSoon}>
            <View style={styles.itemTextWrap}>
              <Text style={[styles.itemTitle, { color: theme.text }]}>清理缓存</Text>
              <Text style={[styles.itemHint, { color: theme.textMuted }]}>清理页面和扫码缓存</Text>
            </View>
            <Text style={[styles.arrow, { color: theme.textSoft }]}>›</Text>
          </Pressable>

          <Pressable style={styles.item} onPress={handleComingSoon}>
            <View style={styles.itemTextWrap}>
              <Text style={[styles.itemTitle, { color: theme.text }]}>关于 Super798</Text>
              <Text style={[styles.itemHint, { color: theme.textMuted }]}>版本信息与更新说明</Text>
            </View>
            <Text style={[styles.arrow, { color: theme.textSoft }]}>›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f8ff',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minWidth: 56,
    height: 34,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 15,
    color: '#4d63df',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    color: '#22325c',
    fontWeight: '800',
  },
  headerSpacer: {
    width: 56,
  },
  group: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e4e8ff',
  },
  item: {
    minHeight: 70,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    color: '#22325c',
    fontWeight: '700',
  },
  itemHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#6f7db4',
  },
  arrow: {
    fontSize: 22,
    color: '#9aa7d9',
    marginLeft: 12,
  },
});
