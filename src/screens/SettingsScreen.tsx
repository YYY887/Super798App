import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppData } from '../context/AppDataContext';

export function SettingsScreen() {
  const router = useRouter();
  const { devices, widgetEnabled, widgetDeviceId, setWidgetOptions } = useAppData();

  function handleComingSoon() {
    alert('敬请期待');
  }

  async function handleToggleWidget() {
    const nextEnabled = !widgetEnabled;
    const fallbackDeviceId = widgetDeviceId || devices[0]?.id || '';

    if (nextEnabled && !fallbackDeviceId) {
      alert('请先添加设备');
      return;
    }

    await setWidgetOptions(nextEnabled, fallbackDeviceId);
  }

  async function handleSelectWidgetDevice(deviceId: string) {
    await setWidgetOptions(true, deviceId);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>返回</Text>
          </Pressable>
          <Text style={styles.title}>设置</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.group}>
          <Pressable style={styles.item} onPress={handleToggleWidget}>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>桌面小组件</Text>
              <Text style={styles.itemHint}>开启后可在桌面快速开始或结束接水</Text>
            </View>
            <View style={[styles.switchPill, widgetEnabled ? styles.switchPillOn : styles.switchPillOff]}>
              <View style={[styles.switchDot, widgetEnabled ? styles.switchDotOn : styles.switchDotOff]} />
            </View>
          </Pressable>

          {widgetEnabled ? (
            <View style={styles.widgetDeviceBlock}>
              <Text style={styles.widgetSectionTitle}>默认设备</Text>
              {devices.length ? (
                devices.map((device) => {
                  const active = widgetDeviceId === device.id;

                  return (
                    <Pressable
                      key={device.id}
                      style={[styles.widgetDeviceItem, active ? styles.widgetDeviceItemActive : null]}
                      onPress={() => handleSelectWidgetDevice(device.id)}
                    >
                      <View style={styles.itemTextWrap}>
                        <Text style={styles.widgetDeviceName}>{device.remark || device.name}</Text>
                        <Text style={styles.widgetDeviceMeta}>{device.ep || device.addr || '未填写地址'}</Text>
                      </View>
                      <Text style={styles.widgetDeviceMark}>{active ? '已选' : '选择'}</Text>
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>暂无设备可用于小组件</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.group}>
          <Pressable style={styles.item} onPress={handleComingSoon}>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>通知设置</Text>
              <Text style={styles.itemHint}>消息提醒和系统通知</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Pressable style={styles.item} onPress={handleComingSoon}>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>相机权限</Text>
              <Text style={styles.itemHint}>扫码、拍照和访问权限</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Pressable style={styles.item} onPress={handleComingSoon}>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>隐私与安全</Text>
              <Text style={styles.itemHint}>账号安全和隐私说明</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.group}>
          <Pressable style={styles.item} onPress={handleComingSoon}>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>清理缓存</Text>
              <Text style={styles.itemHint}>清理页面和扫码缓存</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Pressable style={styles.item} onPress={handleComingSoon}>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>关于 Super798</Text>
              <Text style={styles.itemHint}>版本信息与更新说明</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#ebf0ff',
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
  switchPill: {
    width: 48,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 3,
    justifyContent: 'center',
  },
  switchPillOn: {
    backgroundColor: '#5c74f6',
    alignItems: 'flex-end',
  },
  switchPillOff: {
    backgroundColor: '#dbe2ff',
    alignItems: 'flex-start',
  },
  switchDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  switchDotOn: {
    backgroundColor: '#ffffff',
  },
  switchDotOff: {
    backgroundColor: '#ffffff',
  },
  widgetDeviceBlock: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    gap: 10,
  },
  widgetSectionTitle: {
    fontSize: 13,
    color: '#6f7db4',
    fontWeight: '700',
  },
  widgetDeviceItem: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#f7f8ff',
    borderWidth: 1,
    borderColor: '#e4e8ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  widgetDeviceItemActive: {
    borderColor: '#5c74f6',
    backgroundColor: '#eef2ff',
  },
  widgetDeviceName: {
    fontSize: 15,
    color: '#22325c',
    fontWeight: '700',
  },
  widgetDeviceMeta: {
    marginTop: 3,
    fontSize: 12,
    color: '#6f7db4',
  },
  widgetDeviceMark: {
    fontSize: 13,
    color: '#4d63df',
    fontWeight: '700',
  },
  emptyRow: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: '#f7f8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#6f7db4',
  },
});
