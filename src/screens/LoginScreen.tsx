import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { login, sendLoginCode, getCaptchaUrl } from '../lib/api';
import { randomStr } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useAppNavigation } from '../context/AppNavigationContext';
import { useTheme } from '../context/ThemeContext';

export function LoginScreen() {
  const { theme } = useTheme();
  const { signIn } = useAuth();
  const { setRoute } = useAppNavigation();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaS, setCaptchaS] = useState('');
  const [captchaUri, setCaptchaUri] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    refreshCaptcha();
  }, []);

  function refreshCaptcha() {
    const nextS = randomStr() + randomStr();
    const nextR = Date.now().toString();

    setCaptchaS(nextS);
    setCaptchaUri(getCaptchaUrl(nextS, nextR));
  }

  async function handleSendSms() {
    setError('');

    if (!phone || phone.length !== 11) {
      setError('请输入正确的手机号');
      return;
    }

    if (!captchaInput) {
      setError('请输入图形验证码');
      return;
    }

    setLoading(true);

    try {
      const response = await sendLoginCode(captchaS, captchaInput, phone);
      if (response.code !== 0) {
        setError(response.msg || '图形验证码错误，请重试');
        setCaptchaInput('');
        refreshCaptcha();
        return;
      }

      setStep(2);
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setError('');

    if (!smsCode) {
      setError('请输入短信验证码');
      return;
    }

    setLoading(true);

    try {
      const response = await login(phone, smsCode);
      const nextToken = response.data?.al?.token;

      if (response.code !== 0 || !nextToken) {
        setError(response.msg || '验证码错误或已过期');
        return;
      }

      await signIn(nextToken);
      setRoute('devices');
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  async function handleTokenLogin() {
    const nextToken = tokenInput.trim();
    setError('');

    if (!nextToken) {
      setError('请输入 Token');
      return;
    }

    setLoading(true);

    try {
      await signIn(nextToken);
      setTokenModalVisible(false);
      setTokenInput('');
      setRoute('devices');
    } catch {
      setError('Token 保存失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  function handleGuestScan() {
    setError('');
    setRoute('scan');
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Super 798</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>先登录，再去操作设备和记录。</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.primaryStrong }]}>
          {step === 1 ? (
            <>
              <Text style={[styles.cardTitle, { color: theme.text }]}>手机号登录</Text>

              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textMuted }]}>手机号</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceMuted, borderColor: theme.border, color: theme.text }]}
                  keyboardType="number-pad"
                  maxLength={11}
                  placeholder="请输入手机号"
                  placeholderTextColor="#8da0b3"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textMuted }]}>图形验证码</Text>
                <View style={styles.captchaRow}>
                  <TextInput
                    style={[styles.input, styles.captchaInput, { backgroundColor: theme.surfaceMuted, borderColor: theme.border, color: theme.text }]}
                    placeholder="请输入图形验证码"
                    placeholderTextColor="#8da0b3"
                    value={captchaInput}
                    onChangeText={setCaptchaInput}
                  />
                  <Pressable style={[styles.captchaWrap, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]} onPress={refreshCaptcha}>
                    {captchaUri ? (
                      <Image source={{ uri: captchaUri }} style={styles.captchaImage} resizeMode="cover" />
                    ) : (
                      <Text style={[styles.captchaPlaceholder, { color: theme.textMuted }]}>点击获取</Text>
                    )}
                  </Pressable>
                </View>
              </View>

              <Pressable style={[styles.primaryButton, { backgroundColor: theme.actionBlueStrong }]} onPress={handleSendSms} disabled={loading}>
                <Text style={styles.primaryButtonText}>{loading ? '发送中...' : '获取短信验证码'}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.cardTitle, { color: theme.text }]}>输入验证码</Text>
              <Text style={[styles.hint, { color: theme.textMuted }]}>验证码已发送至 {phone}</Text>

              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textMuted }]}>短信验证码</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceMuted, borderColor: theme.border, color: theme.text }]}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="请输入 6 位验证码"
                  placeholderTextColor="#8da0b3"
                  value={smsCode}
                  onChangeText={setSmsCode}
                />
              </View>

              <Pressable style={[styles.primaryButton, { backgroundColor: theme.actionBlueStrong }]} onPress={handleLogin} disabled={loading}>
                <Text style={styles.primaryButtonText}>{loading ? '登录中...' : '登录'}</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  setStep(1);
                  setSmsCode('');
                  refreshCaptcha();
                }}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>重新获取验证码</Text>
              </Pressable>
            </>
          )}

          {error ? <Text style={[styles.error, { color: theme.dangerText }]}>{error}</Text> : null}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Pressable
            style={[styles.outlineButton, { borderColor: theme.border }]}
            onPress={() => {
              setError('');
              setTokenModalVisible(true);
            }}
            disabled={loading}
          >
            <Text style={[styles.outlineButtonText, { color: theme.text }]}>使用 Token 进入</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleGuestScan} disabled={loading}>
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>不登录，仅使用胖乖扫码</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={tokenModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTokenModalVisible(false)}
      >
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.tokenModal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Token 登录</Text>
                <Text style={[styles.modalHint, { color: theme.textMuted }]}>粘贴已获取的 798 Token，保存后直接进入设备页。</Text>
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, { borderColor: theme.border }]}
                  onPress={() => setTokenModalVisible(false)}
                  disabled={loading}
                >
                  <Text style={[styles.modalButtonText, { color: theme.textMuted }]}>取消</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalPrimaryButton, { backgroundColor: theme.actionBlueStrong }]}
                  onPress={handleTokenLogin}
                  disabled={loading}
                >
                  <Text style={styles.modalPrimaryButtonText}>{loading ? '进入中...' : '进入'}</Text>
                </Pressable>
              </View>
            </View>

            <TextInput
              style={[styles.input, styles.tokenInput, { backgroundColor: theme.surfaceMuted, borderColor: theme.border, color: theme.text }]}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="粘贴 798 Token"
              placeholderTextColor="#8da0b3"
              value={tokenInput}
              onChangeText={setTokenInput}
            />
          </View>

          <Pressable style={styles.modalDismissArea} onPress={() => setTokenModalVisible(false)} />
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f5ff',
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 22,
    gap: 8,
  },
  title: {
    fontSize: 32,
    color: '#22325c',
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    color: '#6f7db4',
  },
  card: {
    borderRadius: 26,
    backgroundColor: '#ffffff',
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#e2e7ff',
    shadowColor: '#5c74f6',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  cardTitle: {
    fontSize: 22,
    color: '#22325c',
    fontWeight: '800',
  },
  hint: {
    fontSize: 13,
    color: '#6f7db4',
    marginTop: -6,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: '#52648f',
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#f6f8ff',
    borderWidth: 1,
    borderColor: '#e3e8ff',
    paddingHorizontal: 14,
    color: '#22325c',
    fontSize: 15,
  },
  tokenInput: {
    height: 52,
    fontSize: 13,
  },
  captchaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  captchaInput: {
    flex: 1,
  },
  captchaWrap: {
    width: 132,
    height: 50,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f6f8ff',
    borderWidth: 1,
    borderColor: '#e3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captchaImage: {
    width: '100%',
    height: '100%',
  },
  captchaPlaceholder: {
    color: '#6f7db4',
    fontSize: 12,
  },
  primaryButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: '#5c74f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  outlineButton: {
    height: 50,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    opacity: 0.8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 130,
  },
  modalDismissArea: {
    flex: 1,
  },
  tokenModal: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    gap: 14,
  },
  modalTitleWrap: {
    gap: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  modalHint: {
    fontSize: 13,
    lineHeight: 19,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryButton: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  secondaryButtonText: {
    color: '#4d63df',
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: '#d14d6b',
    fontSize: 13,
    textAlign: 'center',
  },
});
