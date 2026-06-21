import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '../context/AppDataContext';
import { useAppNavigation } from '../context/AppNavigationContext';
import { useTheme } from '../context/ThemeContext';
import { syncDeviceToWidget } from '../lib/widget';

/*
 * 小组件预览页
 * 目的：在 App 内 1:1 还原 iOS WidgetKit 真机效果，方便开发和用户预览。
 * 数据源：
 *   - 优先取当前选中设备 + 接水状态
 *   - 没有设备时用占位（和 Super798Widget.swift 的 defaultDevice 一致）
 * 注意：
 *   - 这里只是视觉预览，不依赖 App Group UserDefaults
 *   - 「同步到桌面小组件」按钮才会真正调用 SharedDefaults 原生模块
 */

type PreviewData = {
  name: string;
  location: string;
  isOnline: boolean;
  totalMl: number;
  lastDrinkTime: number | null;
};

type PreviewSize = 'small' | 'medium';

function formatTimeAgo(timestamp: number | null, short = false): string | null {
  if (!timestamp) return null;
  const interval = (Date.now() - timestamp) / 1000;
  if (interval < 60) return short ? '刚刚' : '刚刚接水';
  if (interval < 3600) return `${Math.floor(interval / 60)}分钟前${short ? '' : '接水'}`;
  if (interval < 86400) return `${Math.floor(interval / 3600)}小时前${short ? '' : '接水'}`;
  return `${Math.floor(interval / 86400)}天前${short ? '' : '接水'}`;
}

export function WidgetPreviewScreen() {
  const { setRoute } = useAppNavigation();
  const { theme } = useTheme();
  const { devices, selectedId, isDrinking, deviceStatus } = useAppData();
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);

  const previewData: PreviewData = useMemo(() => {
    const device = devices.find((item) => item.id === selectedId);
    if (!device) {
      return {
        name: '我的净水器',
        location: '请打开App绑定设备',
        isOnline: false,
        totalMl: 0,
        lastDrinkTime: null,
      };
    }

    return {
      name: device.remark || device.name || '净水设备',
      location: device.addr || device.ep || '未设置位置',
      isOnline: device.online,
      totalMl: deviceStatus?.out ?? 0,
      lastDrinkTime: isDrinking ? Date.now() : null,
    };
  }, [devices, selectedId, isDrinking, deviceStatus]);

  async function handleSync() {
    if (Platform.OS !== 'ios') {
      Alert.alert('仅 iOS 支持', '桌面小组件目前只在 iOS 上生效');
      return;
    }

    setSyncing(true);
    try {
      await syncDeviceToWidget({
        deviceName: previewData.name,
        location: previewData.location,
        isOnline: previewData.isOnline,
        totalMl: previewData.totalMl,
      });
      setSyncedAt(Date.now());
    } catch {
      Alert.alert('同步失败', '原生模块可能未注入，请先 expo prebuild 再安装');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => setRoute('settings')}>
            <Text style={[styles.backText, { color: theme.primary }]}>返回</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>小组件预览</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={[styles.hint, { color: theme.textMuted }]}>
          以下是桌面小组件当前会显示的内容，数据来自当前选中设备
        </Text>

        <View style={styles.previewBlock}>
          <Text style={[styles.sizeLabel, { color: theme.textSoft }]}>小尺寸 (2x2)</Text>
          <View style={styles.centerRow}>
            <WidgetCanvas size="small">
              <SmallWidgetView data={previewData} />
            </WidgetCanvas>
          </View>
        </View>

        <View style={styles.previewBlock}>
          <Text style={[styles.sizeLabel, { color: theme.textSoft }]}>中尺寸 (4x2)</Text>
          <View style={styles.centerRow}>
            <WidgetCanvas size="medium">
              <MediumWidgetView data={previewData} />
            </WidgetCanvas>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>当前数据</Text>
          <InfoRow label="设备名称" value={previewData.name} theme={theme} />
          <InfoRow label="位置" value={previewData.location} theme={theme} />
          <InfoRow label="在线状态" value={previewData.isOnline ? '在线' : '离线'} theme={theme} />
          <InfoRow
            label="出水量"
            value={previewData.totalMl > 0 ? `${(previewData.totalMl / 1000).toFixed(2)} L` : '—'}
            theme={theme}
          />
          <InfoRow
            label="最近接水"
            value={formatTimeAgo(previewData.lastDrinkTime) ?? '无记录'}
            theme={theme}
          />
        </View>

        <Pressable
          style={[
            styles.syncButton,
            { backgroundColor: syncing ? theme.textSoft : theme.actionBlue },
          ]}
          onPress={handleSync}
          disabled={syncing}
        >
          <Text style={styles.syncButtonText}>
            {syncing ? '同步中...' : '同步到桌面小组件'}
          </Text>
        </Pressable>

        {syncedAt ? (
          <Text style={[styles.syncedHint, { color: theme.successText }]}>
            已同步 · {new Date(syncedAt).toLocaleTimeString()}
          </Text>
        ) : (
          <Text style={[styles.syncedHint, { color: theme.textSoft }]}>
            点击后会写入 App Group 并刷新小组件时间线
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: theme.borderSoft }]}>
      <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// 模拟 WidgetKit 容器：圆角 + 白底 + 阴影，尺寸参照真机 iPhone 14 点数
function WidgetCanvas({ size, children }: { size: PreviewSize; children: React.ReactNode }) {
  const dimensions = size === 'small'
    ? { width: 158, height: 158 }
    : { width: 338, height: 158 };

  return (
    <View style={[canvasStyles.shadow, dimensions]}>
      <View style={[canvasStyles.body, dimensions]}>{children}</View>
    </View>
  );
}

// 对应 Swift 里 SmallWidgetView
function SmallWidgetView({ data }: { data: PreviewData }) {
  const timeAgo = formatTimeAgo(data.lastDrinkTime);

  return (
    <View style={widgetStyles.container}>
      <View style={widgetStyles.headerRow}>
        <View style={widgetStyles.dropIcon}>
          <Text style={widgetStyles.dropText}>💧</Text>
        </View>
        <Text style={widgetStyles.brand}>Super798</Text>
      </View>

      <View style={widgetStyles.spacer} />

      <View style={widgetStyles.bottomBlock}>
        <View style={widgetStyles.deviceRow}>
          <View
            style={[
              widgetStyles.onlineDot,
              { backgroundColor: data.isOnline ? '#22c55e' : '#9ca3af' },
            ]}
          />
          <Text style={widgetStyles.deviceName} numberOfLines={1}>
            {data.name}
          </Text>
        </View>

        {data.totalMl > 0 ? (
          <Text style={widgetStyles.caption}>
            已接 {(data.totalMl / 1000).toFixed(1)}L
          </Text>
        ) : null}

        {timeAgo ? <Text style={widgetStyles.captionSmall}>{timeAgo}</Text> : null}
      </View>
    </View>
  );
}

// 对应 Swift 里 MediumWidgetView
function MediumWidgetView({ data }: { data: PreviewData }) {
  const timeAgoShort = formatTimeAgo(data.lastDrinkTime, true);

  return (
    <View style={[widgetStyles.container, widgetStyles.mediumRow]}>
      <View style={widgetStyles.mediumLeft}>
        <View style={widgetStyles.headerRow}>
          <View style={widgetStyles.dropIcon}>
            <Text style={widgetStyles.dropText}>💧</Text>
          </View>
          <Text style={widgetStyles.brand}>Super798</Text>
        </View>

        <View style={widgetStyles.spacer} />

        <View>
          <View style={widgetStyles.deviceRow}>
            <View
              style={[
                widgetStyles.onlineDot,
                { backgroundColor: data.isOnline ? '#22c55e' : '#9ca3af' },
              ]}
            />
            <Text style={widgetStyles.deviceName} numberOfLines={1}>
              {data.name}
            </Text>
          </View>
          <Text style={widgetStyles.caption} numberOfLines={1}>
            {data.location}
          </Text>
        </View>
      </View>

      <View style={widgetStyles.mediumRight}>
        {data.totalMl > 0 ? (
          <View style={widgetStyles.volumeBlock}>
            <Text style={widgetStyles.volumeNumber}>
              {(data.totalMl / 1000).toFixed(1)}
            </Text>
            <Text style={widgetStyles.caption}>升</Text>
          </View>
        ) : (
          <View style={widgetStyles.volumeBlock}>
            <Text style={widgetStyles.arrowIcon}>➔</Text>
            <Text style={widgetStyles.caption}>打开App</Text>
          </View>
        )}

        <View style={widgetStyles.spacer} />

        {timeAgoShort ? (
          <Text style={widgetStyles.captionSmall}>{timeAgoShort}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 18,
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
  backText: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800' },
  headerSpacer: { width: 56 },
  hint: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  previewBlock: { gap: 10 },
  sizeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  centerRow: {
    alignItems: 'center',
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 2,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: { fontSize: 13 },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  syncButton: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  syncedHint: {
    textAlign: 'center',
    fontSize: 12,
  },
});

const canvasStyles = StyleSheet.create({
  shadow: {
    borderRadius: 22,
    shadowColor: '#1f2937',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 6,
  },
  body: {
    borderRadius: 22,
    backgroundColor: '#f2f2f7',
    overflow: 'hidden',
  },
});

const widgetStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 14,
  },
  mediumRow: {
    flexDirection: 'row',
  },
  mediumLeft: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mediumRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropText: { fontSize: 18 },
  brand: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  spacer: { flex: 1 },
  bottomBlock: { gap: 4 },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    flexShrink: 1,
  },
  caption: {
    fontSize: 11,
    color: '#6b7280',
  },
  captionSmall: {
    fontSize: 10,
    color: '#6b7280',
  },
  volumeBlock: {
    alignItems: 'flex-end',
  },
  volumeNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2563eb',
    lineHeight: 36,
  },
  arrowIcon: {
    fontSize: 28,
    color: '#2563eb',
    lineHeight: 30,
  },
});
