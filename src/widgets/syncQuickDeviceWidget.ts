import { canUseWidgetRuntime } from './runtime';

type SyncQuickDeviceWidgetInput = {
  enabled: boolean;
  accountName: string;
  deviceName: string;
  statusText: string;
};

export function syncQuickDeviceWidget(input: SyncQuickDeviceWidgetInput) {
  if (!canUseWidgetRuntime()) {
    return;
  }

  try {
    const widgetModule = require('./QuickDeviceWidget');
    const QuickDeviceWidget = widgetModule.default;

    QuickDeviceWidget.updateSnapshot({
      enabled: input.enabled,
      accountName: input.accountName,
      deviceName: input.deviceName,
      statusText: input.statusText,
    });
  } catch {
    // Expo Go 和未生成原生 widget 扩展时，跳过同步，不影响主应用使用。
  }
}
