import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../context/ThemeContext';
import { extractSnFromScan, openAlipayDeviceBySn } from '../lib/qiekj';

export function ScanScreen() {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('将设备二维码放入框内');
  const line = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(line, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(line, {
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
    };
  }, [line]);

  async function ensurePermission() {
    if (permission?.granted) {
      return true;
    }

    const result = await requestPermission();
    return result.granted;
  }

  async function handleScan(rawValue: string) {
    if (busy) return;

    const granted = await ensurePermission();
    if (!granted) {
      setStatus('请先允许相机权限');
      return;
    }

    const sn = extractSnFromScan(rawValue);
    if (!sn) {
      setStatus('未识别到设备 SN，请换个角度重试');
      return;
    }

    setBusy(true);
    setStatus(`已识别 SN：${sn}`);

    try {
      const { goodsId } = await openAlipayDeviceBySn(sn);
      setStatus(`即将跳转支付宝，goodsId：${goodsId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '跳转失败';
      setStatus(message);
      Alert.alert('扫码失败', message);
    } finally {
      setTimeout(() => {
        setBusy(false);
      }, 1200);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>扫码直达</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>扫描设备二维码，自动跳转到对应设备</Text>
        </View>

        <View style={styles.centerWrap}>
          <View style={[styles.cameraShell, { backgroundColor: theme.surface, borderColor: theme.borderSoft }]}>
            {permission?.granted ? (
              <CameraView
                style={styles.camera}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={({ data }) => void handleScan(data)}
              />
            ) : (
              <View style={styles.permissionEmpty}>
                <Text style={[styles.permissionTitle, { color: theme.text }]}>需要相机权限</Text>
                <Text style={[styles.permissionHint, { color: theme.textMuted }]}>开启后才能识别设备二维码</Text>
                <Pressable style={[styles.permissionButton, { backgroundColor: theme.actionBlueStrong }]} onPress={() => void ensurePermission()}>
                  <Text style={styles.permissionButtonText}>开启相机</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.overlay} pointerEvents="none">
              <View style={[styles.frame, { borderColor: 'rgba(255,255,255,0.22)' }]}>
                <View style={[styles.corner, styles.cornerTopLeft, { borderColor: '#ffffff' }]} />
                <View style={[styles.corner, styles.cornerTopRight, { borderColor: '#ffffff' }]} />
                <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: '#ffffff' }]} />
                <View style={[styles.corner, styles.cornerBottomRight, { borderColor: '#ffffff' }]} />
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      backgroundColor: '#7ef0a8',
                      transform: [
                        {
                          translateY: line.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 196],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            </View>

            {busy ? (
              <View style={styles.busyMask}>
                <ActivityIndicator size="large" color="#ffffff" />
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statusLabel, { color: theme.textSoft }]}>使用步骤</Text>
          <Text style={[styles.statusText, { color: theme.text }]}>{status}</Text>
          <Text style={[styles.statusHint, { color: theme.textMuted }]}>1. 扫码识别 SN  2. 自动换算 goodsId  3. 唤起支付宝</Text>
          <Text style={[styles.statusHint, { color: theme.textMuted }]}>仅支持胖乖生活洗澡二维码</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f8ff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  cameraShell: {
    height: 440,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 276,
    height: 276,
    borderRadius: 28,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
  },
  cornerTopLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: 16,
    right: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    left: 16,
    bottom: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    right: 16,
    bottom: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLine: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 28,
    height: 3,
    borderRadius: 999,
    shadowColor: '#7ef0a8',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  busyMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  permissionHint: {
    fontSize: 13,
  },
  permissionButton: {
    marginTop: 6,
    height: 44,
    minWidth: 108,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 6,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  statusHint: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
  },
});
