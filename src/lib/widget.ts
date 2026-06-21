import { Platform, NativeModules } from 'react-native';

const APP_GROUP_ID = 'group.wb.uniysc1547.tool1';

/**
 * 向 iOS Widget 的 App Group UserDefaults 写入数据
 * 使用 expo-linking 的 URL scheme 或原生模块桥接
 * 
 * 由于 React Native 不能直接写 App Group UserDefaults，
 * 这里通过 SharedDefaults 原生模块实现（需在 prebuild 后由原生代码支持）
 * 
 * 如果原生模块不可用，静默失败不影响主 App 功能
 */

interface WidgetData {
  widget_device_name: string;
  widget_device_location: string;
  widget_device_online: boolean;
  widget_total_ml: number;
  widget_last_drink_time: number;
}

/**
 * 更新 Widget 显示数据
 */
export async function updateWidgetData(data: Partial<WidgetData>): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const SharedDefaults = NativeModules.SharedDefaults;
    if (SharedDefaults && SharedDefaults.set) {
      await Promise.all(
        Object.entries(data).map(([key, value]) =>
          SharedDefaults.set(key, value, APP_GROUP_ID)
        )
      );
    }
  } catch {
    // Widget 数据更新失败不影响主功能
  }
}

/**
 * 通知 WidgetKit 刷新时间线
 */
export async function reloadWidgetTimeline(): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const SharedDefaults = NativeModules.SharedDefaults;
    if (SharedDefaults && SharedDefaults.reloadTimeline) {
      await SharedDefaults.reloadTimeline('Super798Widget');
    }
  } catch {
    // 静默失败
  }
}

/**
 * 在接水开始/结束后调用，更新 Widget 数据
 */
export async function syncDeviceToWidget(params: {
  deviceName: string;
  location: string;
  isOnline: boolean;
  totalMl?: number;
}): Promise<void> {
  await updateWidgetData({
    widget_device_name: params.deviceName,
    widget_device_location: params.location,
    widget_device_online: params.isOnline,
    widget_total_ml: params.totalMl ?? 0,
    widget_last_drink_time: Date.now(),
  });
  await reloadWidgetTimeline();
}
