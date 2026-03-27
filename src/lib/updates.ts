import * as Updates from 'expo-updates';

export type PreparedUpdateResult =
  | { status: 'disabled'; message: string }
  | { status: 'up-to-date'; message: string }
  | { status: 'available'; message: string }
  | { status: 'error'; message: string };

/*
 * 2026-03-27:
 * EAS Update 是否“可请求”不能只看 isEnabled。
 * 某些包虽然启用了 expo-updates，但如果不是带完整更新配置的正式构建包，
 * 原生层不会注入 channel / runtimeVersion，请求更新时就会直接收到服务端 400。
 * 这里提前拦住，避免把底层报错原样暴露给用户。
 */
function getUpdatesConfigurationError(): string | null {
  if (!Updates.isEnabled) {
    return '当前环境未启用热更新';
  }

  if (!Updates.runtimeVersion) {
    return '当前安装包缺少热更新运行时版本，请重新安装正式发布包';
  }

  if (!Updates.channel) {
    return '当前安装包未绑定发布频道，请安装通过 EAS Build 生成的正式包';
  }

  return null;
}

/*
 * 2026-03-27:
 * 这里统一收口热更新逻辑，避免设置页手动检查和启动阶段强制更新各写一套。
 * 现在项目已经不走 expo-router 启动链，更新逻辑必须尽量轻，不能在启动阶段抛错把壳再卡死。
 */
export async function prepareUpdateIfAvailable(): Promise<PreparedUpdateResult> {
  if (__DEV__) {
    return {
      status: 'disabled',
      message: '当前环境未启用热更新',
    };
  }

  const configurationError = getUpdatesConfigurationError();

  if (configurationError) {
    return {
      status: 'disabled',
      message: configurationError,
    };
  }

  try {
    const result = await Updates.checkForUpdateAsync();

    if (!result.isAvailable) {
      return {
        status: 'up-to-date',
        message: '已经是最新版本',
      };
    }

    await Updates.fetchUpdateAsync();

    return {
      status: 'available',
      message: '检测到新版本，已准备就绪',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新检查失败';

    return {
      status: 'error',
      message,
    };
  }
}

export async function applyPreparedUpdate() {
  if (__DEV__ || getUpdatesConfigurationError()) {
    return false;
  }

  await Updates.reloadAsync();
  return true;
}
