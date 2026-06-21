import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppNavigation } from '../context/AppNavigationContext';
import { cancelScheduledReminder, scheduleDailyWaterReminder } from '../lib/notifications';
import { getStoredWaterReminder, setStoredWaterReminder } from '../lib/storage';
import { useTheme } from '../context/ThemeContext';

const quickTimes = [
  { label: '早上', hour: 9, minute: 0 },
  { label: '午后', hour: 14, minute: 0 },
  { label: '傍晚', hour: 18, minute: 30 },
  { label: '睡前', hour: 21, minute: 30 },
];

function padTime(value: number) {
  return String(value).padStart(2, '0');
}

function normalizeNumber(value: string, max: number) {
  const digits = value.replace(/\D/g, '').slice(0, 2);
  if (!digits) return '';

  const parsed = Number(digits);
  if (Number.isNaN(parsed)) return '';
  return String(Math.min(parsed, max));
}

export function WaterReminderScreen() {
  const { setRoute } = useAppNavigation();
  const { theme } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState('9');
  const [minute, setMinute] = useState('0');
  const [notificationId, setNotificationId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    getStoredWaterReminder().then((config) => {
      if (!mounted || !config) return;

      setEnabled(config.enabled);
      setHour(String(config.hour));
      setMinute(String(config.minute));
      setNotificationId(config.notificationId || '');
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSave(nextEnabled = enabled) {
    const nextHour = Number(hour);
    const nextMinute = Number(minute);

    if (!Number.isInteger(nextHour) || nextHour < 0 || nextHour > 23) {
      Alert.alert('时间不对哦', '小时请填写 0 到 23');
      return;
    }

    if (!Number.isInteger(nextMinute) || nextMinute < 0 || nextMinute > 59) {
      Alert.alert('时间不对哦', '分钟请填写 0 到 59');
      return;
    }

    setSaving(true);

    try {
      await cancelScheduledReminder(notificationId);

      let nextNotificationId = '';
      if (nextEnabled) {
        nextNotificationId = await scheduleDailyWaterReminder(nextHour, nextMinute);
        if (!nextNotificationId) {
          Alert.alert('通知没打开', '请允许通知权限后再开启喝水提醒');
          setEnabled(false);
          await setStoredWaterReminder({ enabled: false, hour: nextHour, minute: nextMinute });
          return;
        }
      }

      setNotificationId(nextNotificationId);
      setEnabled(nextEnabled);
      await setStoredWaterReminder({
        enabled: nextEnabled,
        hour: nextHour,
        minute: nextMinute,
        notificationId: nextNotificationId,
      });

      Alert.alert(nextEnabled ? '提醒已设置' : '提醒已关闭', nextEnabled ? `每天 ${padTime(nextHour)}:${padTime(nextMinute)} 提醒你喝水～` : '喝水提醒已经关掉啦');
    } finally {
      setSaving(false);
    }
  }

  function handleToggle(value: boolean) {
    void handleSave(value);
  }

  function handleQuickTime(nextHour: number, nextMinute: number) {
    setHour(String(nextHour));
    setMinute(String(nextMinute));
  }

  const previewHour = Number(hour) || 0;
  const previewMinute = Number(minute) || 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => setRoute('settings')}>
            <Text style={[styles.backText, { color: theme.primary }]}>返回</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>喝水提醒</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroTitle, { color: theme.text }]}>每天温柔提醒</Text>
              <Text style={[styles.heroHint, { color: theme.textMuted }]}>到了时间就提醒你喝水。</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              disabled={saving}
              trackColor={{ false: theme.switchTrackOff, true: theme.actionBlue }}
              thumbColor={theme.switchThumb}
            />
          </View>

          <Text style={[styles.previewTime, { color: theme.primary }]}>
            {padTime(previewHour)}:{padTime(previewMinute)}
          </Text>
          <Text style={[styles.previewHint, { color: theme.textMuted }]}>
            {enabled ? '提醒正在待命，记得及时补水～' : '开启后会每天按这个时间提醒你。'}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>自定义时间</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={[styles.label, { color: theme.textMuted }]}>小时</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceMuted, borderColor: theme.border, color: theme.text }]}
                keyboardType="number-pad"
                maxLength={2}
                value={hour}
                onChangeText={(value) => setHour(normalizeNumber(value, 23))}
              />
            </View>
            <Text style={[styles.timeColon, { color: theme.textMuted }]}>:</Text>
            <View style={styles.timeField}>
              <Text style={[styles.label, { color: theme.textMuted }]}>分钟</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceMuted, borderColor: theme.border, color: theme.text }]}
                keyboardType="number-pad"
                maxLength={2}
                value={minute}
                onChangeText={(value) => setMinute(normalizeNumber(value, 59))}
              />
            </View>
          </View>

          <View style={styles.quickGrid}>
            {quickTimes.map((item) => (
              <Pressable
                key={item.label}
                style={[styles.quickButton, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
                onPress={() => handleQuickTime(item.hour, item.minute)}
              >
                <Text style={[styles.quickLabel, { color: theme.text }]}>{item.label}</Text>
                <Text style={[styles.quickTime, { color: theme.textMuted }]}>{padTime(item.hour)}:{padTime(item.minute)}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.saveButton, { backgroundColor: theme.actionBlueStrong }]}
            onPress={() => void handleSave(true)}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? '保存中...' : '保存并开启提醒'}</Text>
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
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  heroHint: {
    marginTop: 4,
    fontSize: 13,
  },
  previewTime: {
    fontSize: 48,
    fontWeight: '800',
  },
  previewHint: {
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  timeField: {
    flex: 1,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  timeColon: {
    height: 56,
    lineHeight: 54,
    fontSize: 28,
    fontWeight: '800',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickButton: {
    width: '47.5%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  quickLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  quickTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
