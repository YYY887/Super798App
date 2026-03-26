import { useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Animated,
  Alert,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppData } from '../context/AppDataContext';
import { formatLiters, formatName } from '../lib/utils';

export function DevicesScreen() {
  const insets = useSafeAreaInsets();
  const {
    loading,
    actionLoading,
    account,
    devices,
    selectedId,
    isDrinking,
    deviceStatus,
    accScore,
    message,
    setSelectedId,
    refreshDevices,
    startDrinking,
    stopDrinking,
    bindDevice,
    removeDevice,
    saveDeviceRemark,
    clearMessage,
  } = useAppData();
  const [scanVisible, setScanVisible] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [editingDeviceId, setEditingDeviceId] = useState('');
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const selectedDevice = devices.find((item) => item.id === selectedId);

  useEffect(() => {
    if (!scanVisible) {
      scanLineAnim.stopAnimation();
      scanLineAnim.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
      scanLineAnim.setValue(0);
    };
  }, [scanLineAnim, scanVisible]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      clearMessage();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [clearMessage, message]);

  async function handleOpenScan() {
    setScanning(true);
    setScanVisible(true);
  }

  async function handleScan(deviceRaw: string) {
    if (!scanning) return;

    setScanning(false);

    const parts = deviceRaw.split('/');
    const deviceId = parts[parts.length - 1];

    const success = await bindDevice(deviceId);
    if (!success) {
      setScanning(true);
      return;
    }

    setScanVisible(false);
  }

  function handleLongPress(deviceId: string) {
    const device = devices.find((item) => item.id === deviceId);
    if (!device || isDrinking) return;

    setEditingDeviceId(deviceId);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['取消', '编辑备注', '删除设备'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
          userInterfaceStyle: 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleOpenRemark(deviceId);
          }

          if (buttonIndex === 2) {
            void handleDeleteDevice(deviceId);
          }
        },
      );
      return;
    }

    Alert.alert(formatName(device.name), undefined, [
      { text: '取消', style: 'cancel' },
      { text: '编辑备注', onPress: () => handleOpenRemark(deviceId) },
      { text: '删除设备', style: 'destructive', onPress: () => void handleDeleteDevice(deviceId) },
    ]);
  }

  async function handleDeleteDevice(deviceId: string) {
    if (!deviceId) return;

    const success = await removeDevice(deviceId);
    if (success) {
      setEditingDeviceId('');
    }
  }

  function handleOpenRemark(deviceId: string) {
    const device = devices.find((item) => item.id === deviceId);
    if (!device) return;

    if (Platform.OS === 'ios') {
      Alert.prompt(
        '设备备注',
        '给这个设备起个更好记的名字',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '保存',
            onPress: (value?: string) => {
              void saveDeviceRemark(deviceId, value || '');
              setEditingDeviceId('');
            },
          },
        ],
        'plain-text',
        device.remark || '',
      );
      return;
    }

    Alert.prompt(
      '设备备注',
      '给这个设备起个更好记的名字',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '保存',
          onPress: (value?: string) => {
            void saveDeviceRemark(deviceId, value || '');
            setEditingDeviceId('');
          },
        },
      ],
      'plain-text',
      device.remark || '',
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshDevices}
            tintColor="#6faed9"
            colors={['#6faed9']}
          />
        }
      >
        <View style={styles.topBar}>
          <View style={styles.profileWrap}>
            {account?.img ? (
              <Image source={{ uri: account.img }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{account?.name?.slice(0, 1) || '用'}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{account?.name || '未登录'}</Text>
              <Text style={styles.profileMeta}>{account?.pn || '请先完成登录'}</Text>
            </View>
          </View>

          <Pressable style={styles.scanButton} onPress={handleOpenScan}>
            <View style={styles.scanIcon}>
              <View style={[styles.scanCorner, styles.scanCornerTopLeft]} />
              <View style={[styles.scanCorner, styles.scanCornerTopRight]} />
              <View style={[styles.scanCorner, styles.scanCornerBottomLeft]} />
              <View style={[styles.scanCorner, styles.scanCornerBottomRight]} />
              <View style={styles.scanBar} />
            </View>
          </Pressable>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusDecorWrap} pointerEvents="none">
            <View style={[styles.waterDrop, styles.statusDropLarge]} />
            <View style={[styles.waterDrop, styles.statusDropMedium]} />
            <View style={[styles.waterRing, styles.statusRing]} />
          </View>

          <View style={styles.statusLeft}>
            <Text style={styles.statusLabel}>当前设备</Text>
            <Text style={styles.statusValue}>{selectedDevice ? formatName(selectedDevice.name) : '未选择'}</Text>
          </View>
          <View style={styles.statusRight}>
            <Text style={styles.statusBadge}>{isDrinking ? '接水中' : '待开始'}</Text>
            <Text style={styles.statusMeta}>
              {isDrinking && deviceStatus ? `${formatLiters(deviceStatus.out)} / ${accScore || 0} 分` : account?.pn || '准备开始'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>设备列表</Text>
          <Text style={styles.sectionMeta}>{devices.length} 台</Text>
        </View>

        {loading ? (
          <View style={styles.emptyBlock}>
            <ActivityIndicator color="#6faed9" />
            <Text style={styles.emptyText}>正在加载设备...</Text>
          </View>
        ) : devices.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>暂无设备，先点右上角添加。</Text>
          </View>
        ) : (
          devices.map((device) => {
            const isSelected = selectedId === device.id;
            const currentStatus = isSelected && isDrinking ? '接水中' : device.status === 99 ? '空闲' : '使用中';

            return (
              <Pressable
                key={device.id}
                style={[styles.deviceItem, isSelected ? styles.deviceItemSelected : null]}
                onPress={() => setSelectedId(device.id)}
                onLongPress={() => handleLongPress(device.id)}
                delayLongPress={450}
              >
                <View style={styles.deviceDecorWrap} pointerEvents="none">
                  <View style={[styles.waterDrop, styles.deviceDropLarge]} />
                  <View style={[styles.waterDrop, styles.deviceDropSmall]} />
                </View>

                <View style={styles.deviceMain}>
                  <View style={styles.deviceTitleRow}>
                    <Text style={styles.deviceName}>{formatName(device.name)}</Text>
                    <Text style={[styles.deviceTag, device.online ? styles.tagOnline : styles.tagOffline]}>
                      {device.online ? '在线' : '离线'}
                    </Text>
                    <Text style={[styles.deviceTag, currentStatus === '空闲' ? styles.tagIdle : styles.tagBusy]}>
                      {currentStatus}
                    </Text>
                  </View>
                  {device.remark ? <Text style={styles.deviceRemark}>{device.remark}</Text> : null}
                  <Text style={styles.deviceLocation}>{device.addr || '暂无位置'}</Text>
                  <Text style={styles.deviceLocation}>{device.ep || '暂无楼栋信息'}</Text>
                </View>
                {isSelected ? <Text style={styles.selectedMark}>已选</Text> : null}
              </Pressable>
            );
          })
        )}

        <Pressable
          style={[styles.listActionButton, isDrinking ? styles.stopButton : styles.startButton]}
          onPress={isDrinking ? stopDrinking : startDrinking}
          disabled={actionLoading || loading || !selectedId}
        >
          <Text style={[styles.mainButtonText, isDrinking ? styles.stopButtonText : styles.startButtonText]}>
            {actionLoading ? '处理中...' : isDrinking ? '停止接水' : '开始接水'}
          </Text>
        </Pressable>

        {message ? (
          <Pressable style={styles.inlineMessage} onPress={clearMessage}>
            <Text style={styles.inlineMessageText}>{message}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal visible={scanVisible} animationType="slide" onRequestClose={() => setScanVisible(false)}>
        <SafeAreaView style={styles.scanSafeArea} edges={['top', 'bottom']}>
          <View style={[styles.scanHeader, { paddingTop: Math.max(insets.top, 16) }]}>
            <Text style={styles.scanTitle}>扫描设备二维码</Text>
            <Pressable onPress={() => setScanVisible(false)}>
              <Text style={styles.scanClose}>关闭</Text>
            </Pressable>
          </View>

          <View style={styles.scanCameraWrap}>
            <View style={styles.scanEmpty}>
              <Text style={styles.scanEmptyText}>当前安装环境暂时关闭扫码模块</Text>
              <Text style={styles.scanEmptyHint}>先确认应用稳定启动，再恢复相机能力。</Text>
            </View>

            <View style={styles.scanGuide} pointerEvents="none">
              <View style={styles.scanFrame}>
                <View style={[styles.scanFrameCorner, styles.scanFrameTopLeft]} />
                <View style={[styles.scanFrameCorner, styles.scanFrameTopRight]} />
                <View style={[styles.scanFrameCorner, styles.scanFrameBottomLeft]} />
                <View style={[styles.scanFrameCorner, styles.scanFrameBottomRight]} />
                <Animated.View
                  style={[
                    styles.scanGuideLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 184],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
              <Text style={styles.scanGuideText}>将二维码放入框内自动识别</Text>
            </View>
          </View>

          <View style={[styles.scanFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={styles.scanFooterText}>对准设备二维码即可自动绑定</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40, gap: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  profileWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5c74f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f3f3',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  profileInfo: { gap: 2 },
  profileName: { fontSize: 20, color: '#22325c', fontWeight: '800' },
  profileMeta: { fontSize: 13, color: '#7a86b2' },
  scanButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef1ff',
  },
  scanIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderColor: '#5c74f6',
  },
  scanCornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  scanCornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  scanCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  scanCornerBottomRight: {
    right: 0,
    bottom: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  scanBar: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: 8,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#5c74f6',
  },
  statusRow: {
    borderRadius: 22,
    backgroundColor: '#eef2ff',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: '#dbe1ff',
    overflow: 'hidden',
    position: 'relative',
  },
  statusDecorWrap: {
    position: 'absolute',
    right: -6,
    top: -6,
    bottom: -8,
    width: 146,
  },
  statusLeft: { flex: 1, gap: 6 },
  statusLabel: { fontSize: 12, color: '#6f7db4' },
  statusValue: { fontSize: 24, color: '#22325c', fontWeight: '800' },
  statusRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#dbe2ff',
    color: '#4d63df',
    fontSize: 12,
    fontWeight: '700',
  },
  statusMeta: { color: '#6f7db4', fontSize: 12 },
  listActionButton: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  startButton: { backgroundColor: '#5c74f6' },
  stopButton: { backgroundColor: '#ffefe3' },
  mainButtonText: { fontSize: 16, fontWeight: '800' },
  startButtonText: { color: '#ffffff' },
  stopButtonText: { color: '#f08a24' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 22, color: '#22325c', fontWeight: '800' },
  sectionMeta: { fontSize: 13, color: '#6f7db4', fontWeight: '700' },
  emptyBlock: {
    borderRadius: 22,
    backgroundColor: '#f7f8ff',
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e8ff',
  },
  emptyText: { color: '#6f7db4', fontSize: 14 },
  deviceItem: {
    borderRadius: 24,
    backgroundColor: '#f8f9ff',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e4e8ff',
    overflow: 'hidden',
    position: 'relative',
  },
  deviceItemSelected: {
    borderWidth: 1,
    borderColor: '#5c74f6',
    backgroundColor: '#eef2ff',
  },
  deviceDecorWrap: {
    position: 'absolute',
    right: -10,
    top: -10,
    width: 120,
    height: 100,
  },
  deviceMain: { flex: 1, gap: 6 },
  deviceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  deviceName: { fontSize: 19, color: '#22325c', fontWeight: '800' },
  deviceTag: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  tagOnline: { backgroundColor: '#e7f6ef', color: '#2b7d54' },
  tagOffline: { backgroundColor: '#edf0f8', color: '#7b86a3' },
  tagIdle: { backgroundColor: '#edf1ff', color: '#4d63df' },
  tagBusy: { backgroundColor: '#ffe7ea', color: '#e25363' },
  deviceLocation: { color: '#6f7db4', fontSize: 13 },
  deviceRemark: { color: '#4d63df', fontSize: 13, fontWeight: '600' },
  selectedMark: { color: '#4d63df', fontSize: 13, fontWeight: '700' },
  inlineMessage: {
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dde3ff',
  },
  inlineMessageText: {
    color: '#4d63df',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  waterDrop: {
    position: 'absolute',
    backgroundColor: 'rgba(92,116,246,0.08)',
    borderRadius: 999,
    transform: [{ rotate: '24deg' }],
  },
  waterRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(92,116,246,0.12)',
  },
  statusDropLarge: {
    width: 92,
    height: 92,
    right: 18,
    top: 12,
  },
  statusDropMedium: {
    width: 52,
    height: 52,
    right: 92,
    top: 54,
  },
  statusRing: {
    width: 110,
    height: 110,
    right: 36,
    top: 8,
  },
  deviceDropLarge: {
    width: 62,
    height: 62,
    right: 20,
    top: 14,
  },
  deviceDropSmall: {
    width: 34,
    height: 34,
    right: 74,
    top: 48,
  },
  scanSafeArea: { flex: 1, backgroundColor: '#000000' },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  scanTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  scanClose: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  scanCameraWrap: {
    flex: 1,
    position: 'relative',
  },
  camera: { flex: 1 },
  scanGuide: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  scanFrameCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#ffffff',
  },
  scanFrameTopLeft: {
    top: 14,
    left: 14,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  scanFrameTopRight: {
    top: 14,
    right: 14,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  scanFrameBottomLeft: {
    left: 14,
    bottom: 14,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
  },
  scanFrameBottomRight: {
    right: 14,
    bottom: 14,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  scanGuideLine: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 28,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#74ff9f',
    shadowColor: '#74ff9f',
    shadowOpacity: 0.85,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  scanGuideText: {
    marginTop: 18,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  scanEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanEmptyText: { color: '#ffffff', fontSize: 14 },
  scanEmptyHint: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
  },
  scanFooter: {
    paddingHorizontal: 18,
    paddingTop: 14,
    backgroundColor: '#000000',
  },
  scanFooterText: { color: '#d0d0d0', fontSize: 13, textAlign: 'center' },
});
