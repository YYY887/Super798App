import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from '../context/AppNavigationContext';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';
import {
  getStoredWidgetDeviceId,
  setStoredWidgetDeviceId,
  setStoredWidgetDeviceName,
} from '../lib/storage';
import { refreshNativeWidget, syncWidgetDevice } from '../lib/widgetPreferences';

export function SettingsScreen() {
  const { setRoute } = useAppNavigation();
  const { isDark, setIsDark, theme } = useTheme();
  const { devices, selectedId, setSelectedId } = useAppData();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const [widgetDeviceId, setWidgetDeviceId] = useState('');

  useEffect(() => {
    let mounted = true;

    getStoredWidgetDeviceId().then((storedId) => {
      if (!mounted) return;

      if (storedId && devices.some((item) => item.id === storedId)) {
        setWidgetDeviceId(storedId);
        return;
      }

      if (devices.length > 0) {
        setWidgetDeviceId((current) => current || selectedId || devices[0].id);
      }
    });

    return () => {
      mounted = false;
    };
  }, [devices, selectedId]);

  const widgetDevice = useMemo(
    () => devices.find((item) => item.id === widgetDeviceId) ?? devices.find((item) => item.id === selectedId) ?? devices[0],
    [devices, selectedId, widgetDeviceId],
  );

  function handleComingSoon() {
    alert('敬请期待');
  }

  async function handleSelectWidgetDevice(deviceId: string) {
    const device = devices.find((item) => item.id === deviceId);
    if (!device) return;

    /*
     * 2026-03-27:
     * 小组件读不到 SecureStore，因此这里除了 JS 侧存储，还要额外同步到 Android SharedPreferences。
     * 后续如果替换存储方案，不能漏掉这条原生同步，否则桌面点击“喝水”会找不到目标设备。
     */
    setWidgetDeviceId(deviceId);
    setSelectedId(deviceId);
    await setStoredWidgetDeviceId(deviceId);
    await setStoredWidgetDeviceName(device.remark || device.name);
    await syncWidgetDevice(deviceId, device.remark || device.name);
  }

  async function handleToggleDarkMode(enabled: boolean) {
    setIsDark(enabled);
    await refreshNativeWidget();
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
              <Text style={[styles.itemHint, { color: theme.textMuted }]}>小组件预览也会同步黑色风格</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(value) => void handleToggleDarkMode(value)}
              trackColor={{ false: theme.switchTrackOff, true: theme.actionBlue }}
              thumbColor={theme.switchThumb}
            />
          </View>
        </View>

        <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.widgetBlock}>
            <View style={styles.widgetHeader}>
              <View style={styles.itemTextWrap}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>桌面小组件</Text>
                <Text style={[styles.itemHint, { color: theme.textMuted }]}>
                  黑色双按钮，支持启动扫码和一键喝水
                </Text>
              </View>
              <View style={[styles.widgetBadge, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
                <Text style={[styles.widgetBadgeText, { color: theme.textMuted }]}>
                  {Platform.OS === 'ios' ? 'iOS 可用' : '仅 iOS'}
                </Text>
              </View>
            </View>

            <View style={styles.widgetPreviewWrap}>
              <View style={styles.widgetPreview}>
                <Text style={styles.widgetPreviewCaption}>Super798 Widget</Text>
                <Text style={styles.widgetPreviewDevice} numberOfLines={1}>
                  {widgetDevice ? widgetDevice.remark || widgetDevice.name : '先选一个设备'}
                </Text>
                <View style={styles.widgetPreviewActions}>
                  <View style={[styles.widgetAction, styles.widgetActionPrimary]}>
                    <Text style={[styles.widgetActionLabel, styles.widgetActionLabelPrimary]}>扫码</Text>
                  </View>
                  <View style={styles.widgetAction}>
                    <Text style={styles.widgetActionLabel}>喝水</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.selectorHeader}>
              <Text style={[styles.selectorTitle, { color: theme.text }]}>喝水默认设备</Text>
              <Text style={[styles.selectorHint, { color: theme.textMuted }]}>
                iOS 小组件点击“喝水”时会直接用这个设备
              </Text>
            </View>

            <View style={styles.selectorList}>
              {devices.length > 0 ? (
                devices.map((device) => {
                  const active = widgetDevice?.id === device.id;

                  return (
                    <Pressable
                      key={device.id}
                      style={[
                        styles.deviceChip,
                        {
                          backgroundColor: active ? theme.primarySoft : theme.surfaceMuted,
                          borderColor: active ? theme.actionBlueStrong : theme.border,
                        },
                      ]}
                      onPress={() => void handleSelectWidgetDevice(device.id)}
                    >
                      <View style={styles.deviceChipTextWrap}>
                        <Text style={[styles.deviceChipTitle, { color: theme.text }]} numberOfLines={1}>
                          {device.remark || device.name}
                        </Text>
                        <Text style={[styles.deviceChipHint, { color: theme.textMuted }]} numberOfLines={1}>
                          {device.addr || '已绑定设备'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.deviceChipDot,
                          { backgroundColor: active ? theme.actionBlueStrong : theme.borderSoft },
                        ]}
                      />
                    </Pressable>
                  );
                })
              ) : (
                <View style={[styles.emptyHintBox, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                  <Text style={[styles.emptyHintText, { color: theme.textMuted }]}>
                    先去设备页绑定设备，才能给小组件设置一键喝水。
                  </Text>
                </View>
              )}
            </View>
          </View>
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
          <View style={[styles.item, { borderBottomColor: theme.borderSoft }]}>
            <View style={styles.itemTextWrap}>
              <Text style={[styles.itemTitle, { color: theme.text }]}>当前版本</Text>
              <Text style={[styles.itemHint, { color: theme.textMuted }]}>当前版本 {version}</Text>
            </View>
          </View>

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
  widgetBlock: {
    padding: 18,
    gap: 16,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  widgetBadge: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  widgetPreviewWrap: {
    alignItems: 'center',
  },
  widgetPreview: {
    width: '100%',
    borderRadius: 26,
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: '#1f1f1f',
    padding: 18,
    gap: 12,
  },
  widgetPreviewCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8a8a8a',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  widgetPreviewDevice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  widgetPreviewActions: {
    flexDirection: 'row',
    gap: 10,
  },
  widgetAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#262626',
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetActionPrimary: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  widgetActionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  widgetActionLabelPrimary: {
    color: '#050505',
  },
  selectorHeader: {
    gap: 4,
  },
  selectorTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  selectorHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  selectorList: {
    gap: 10,
  },
  deviceChip: {
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deviceChipTextWrap: {
    flex: 1,
    gap: 4,
  },
  deviceChipTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  deviceChipHint: {
    fontSize: 12,
  },
  deviceChipDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  emptyHintBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  emptyHintText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
