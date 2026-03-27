import * as Updates from 'expo-updates';

export type PreparedUpdateResult =
  | { status: 'disabled'; message: string }
  | { status: 'up-to-date'; message: string }
  | { status: 'available'; message: string }
  | { status: 'error'; message: string };

/*
 * 2026-03-27:
 * 这里统一收口热更新逻辑，避免设置页手动检查和启动阶段强制更新各写一套。
 * 现在项目已经不走 expo-router 启动链，更新逻辑必须尽量轻，不能在启动阶段抛错把壳再卡死。
 */
export async function prepareUpdateIfAvailable(): Promise<PreparedUpdateResult> {
  if (__DEV__ || !Updates.isEnabled) {
    return {
      status: 'disabled',
      message: '当前环境未启用热更新',
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
  if (__DEV__ || !Updates.isEnabled) {
    return false;
  }

  await Updates.reloadAsync();
  return true;
}
