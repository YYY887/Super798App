import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppNavigation } from '../context/AppNavigationContext';
import { useTheme } from '../context/ThemeContext';

const APP_VERSION = 'v2.0.1';

const usageTips = [
  '手机号登录后可查看 798 账户设备、积分和设备状态。',
  '可在我的页面复制当前 798 Token，下次通过 Token 快速进入。',
  '扫码页可不登录使用，用于扫描胖乖生活二维码并跳转支付宝。',
  '设备页选择常用设备后，可以开始或结束接水操作。',
  '长按设备可复制快捷启动链接、编辑备注或删除设备。',
];

export function AboutScreen() {
  const { setRoute } = useAppNavigation();
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => setRoute('profile')}>
            <Text style={[styles.backText, { color: theme.primary }]}>返回</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>关于</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.appName, { color: theme.text }]}>Super798</Text>
          <Text style={[styles.version, { color: theme.primary }]}>当前版本 {APP_VERSION}</Text>
          <Text style={[styles.summary, { color: theme.textMuted }]}>
            Super798 用于 798 净水设备管理和胖乖扫码直达，支持短信登录、Token 快速进入、设备操作和扫码跳转。
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>使用方法</Text>
          {usageTips.map((tip, index) => (
            <View key={tip} style={styles.tipRow}>
              <View style={[styles.tipBadge, { backgroundColor: theme.primarySoft }]}>
                <Text style={[styles.tipBadgeText, { color: theme.primary }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.tipText, { color: theme.textMuted }]}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>免责声明</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            作者未收集任何用户信息。本产品仅供内部使用，如有顾虑请在下载后 24 小时内删除。
          </Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Token 属于账户登录凭证，请只在自己的设备上复制和使用。胖乖扫码功能可独立使用，不会要求登录 798 账户。
          </Text>
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
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 56,
  },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
  },
  version: {
    fontSize: 16,
    fontWeight: '800',
  },
  summary: {
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tipBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
  },
});
