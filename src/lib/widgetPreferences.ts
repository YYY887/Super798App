import { NativeModules, Platform } from 'react-native';

type WidgetPreferencesModuleType = {
  setWidgetDevice(deviceId: string, deviceName: string): Promise<void>;
  getWidgetDevice(): Promise<{ deviceId: string; deviceName: string }>;
  refreshWidget(): Promise<void>;
};

const moduleRef = NativeModules.WidgetPreferences as WidgetPreferencesModuleType | undefined;

export async function syncWidgetDevice(deviceId: string, deviceName: string) {
  if ((Platform.OS !== 'android' && Platform.OS !== 'ios') || !moduleRef) {
    return;
  }

  try {
    await moduleRef.setWidgetDevice(deviceId, deviceName);
    await moduleRef.refreshWidget();
  } catch {
    /*
     * 2026-03-27:
     * 小组件同步失败不能影响主流程，设置页里仍然要允许用户先保存设备选择。
     * 这里故意吞掉原生异常，避免因为单个机型的小组件能力异常把设置页卡死。
     */
  }
}

export async function refreshNativeWidget() {
  if ((Platform.OS !== 'android' && Platform.OS !== 'ios') || !moduleRef) {
    return;
  }

  try {
    await moduleRef.refreshWidget();
  } catch {
    // ignore
  }
}
