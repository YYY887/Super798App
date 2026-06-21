import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const ANDROID_CHANNEL_ID = 'super798-cute-status';
let permissionChecked = false;
let channelReady = false;

async function ensureNotificationReady() {
  if (Platform.OS === 'android' && !channelReady) {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Super798 提醒',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 80, 180],
      lightColor: '#5c74f6',
    });
    channelReady = true;
  }

  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted) {
    permissionChecked = true;
    return true;
  }

  if (permissionChecked) {
    return false;
  }

  permissionChecked = true;
  const nextPermission = await Notifications.requestPermissionsAsync();
  return nextPermission.granted;
}

export async function notifyCute(title: string, body: string) {
  try {
    const ready = await ensureNotificationReady();
    if (!ready) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null,
    });
  } catch {
    // 通知失败不影响主流程。
  }
}

export function notifyDrinkStarted(deviceName?: string) {
  return notifyCute('接水啦接水啦', deviceName ? `${deviceName} 已经开始工作啦～` : '设备已经开始工作啦～');
}

export function notifyDrinkStopped(deviceName?: string) {
  return notifyCute('已经停止了哦', deviceName ? `${deviceName} 已经停下来了，记得拿水～` : '设备已经停下来了，记得拿水～');
}

export function notifyScanSuccess(goodsId: string) {
  return notifyCute('扫码成功啦', `已经找到设备 ${goodsId}，马上帮你跳过去～`);
}

export function notifyScanFailed(message: string) {
  return notifyCute('扫码没成功', `${message}，换个角度再试试～`);
}

export async function scheduleDailyWaterReminder(hour: number, minute: number) {
  const ready = await ensureNotificationReady();
  if (!ready) return '';

  return Notifications.scheduleNotificationAsync({
    content: {
      title: '该喝水啦',
      body: '咕噜咕噜补点水，今天也要照顾好自己～',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
    },
  });
}

export async function cancelScheduledReminder(notificationId?: string) {
  if (!notificationId) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // 取消失败不影响页面状态。
  }
}
