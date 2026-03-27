const TOKEN_KEY = 'drink_token';
const DEVICE_REMARK_PREFIX = 'device_remark_';
const DARK_MODE_KEY = 'ui_dark_mode';
const WIDGET_DEVICE_ID_KEY = 'widget_device_id';
const WIDGET_DEVICE_NAME_KEY = 'widget_device_name';

const memoryStore = new Map<string, string>();

function getSecureStore() {
  try {
    /*
     * 2026-03-26:
     * 某些非标准安装/签名环境下，SecureStore 底层依赖的 Keychain 能力可能异常。
     * 这里改成懒加载并允许回退，目标是“应用先能启动”，哪怕令牌只做临时内存存储。
     * 后续如果恢复标准签名环境，不要删掉这个兜底，否则启动阶段可能再次闪退。
     */
    return require('expo-secure-store') as typeof import('expo-secure-store');
  } catch {
    return null;
  }
}

async function getItem(key: string) {
  const store = getSecureStore();

  if (!store) {
    return memoryStore.get(key) ?? null;
  }

  try {
    return await store.getItemAsync(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

async function setItem(key: string, value: string) {
  const store = getSecureStore();
  memoryStore.set(key, value);

  if (!store) {
    return;
  }

  try {
    await store.setItemAsync(key, value);
  } catch {
    return;
  }
}

async function deleteItem(key: string) {
  const store = getSecureStore();
  memoryStore.delete(key);

  if (!store) {
    return;
  }

  try {
    await store.deleteItemAsync(key);
  } catch {
    return;
  }
}

export async function getStoredToken() {
  return getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string) {
  return setItem(TOKEN_KEY, token);
}

export async function clearStoredToken() {
  return deleteItem(TOKEN_KEY);
}

export async function getDeviceRemark(deviceId: string) {
  return getItem(`${DEVICE_REMARK_PREFIX}${deviceId}`);
}

export async function setDeviceRemark(deviceId: string, value: string) {
  const key = `${DEVICE_REMARK_PREFIX}${deviceId}`;

  if (!value) {
    return deleteItem(key);
  }

  return setItem(key, value);
}

export async function getStoredDarkMode() {
  return (await getItem(DARK_MODE_KEY)) === '1';
}

export async function setStoredDarkMode(enabled: boolean) {
  if (!enabled) {
    return deleteItem(DARK_MODE_KEY);
  }

  return setItem(DARK_MODE_KEY, '1');
}

export async function getStoredWidgetDeviceId() {
  return getItem(WIDGET_DEVICE_ID_KEY);
}

export async function setStoredWidgetDeviceId(deviceId: string) {
  if (!deviceId) {
    return deleteItem(WIDGET_DEVICE_ID_KEY);
  }

  return setItem(WIDGET_DEVICE_ID_KEY, deviceId);
}

export async function getStoredWidgetDeviceName() {
  return getItem(WIDGET_DEVICE_NAME_KEY);
}

export async function setStoredWidgetDeviceName(deviceName: string) {
  if (!deviceName) {
    return deleteItem(WIDGET_DEVICE_NAME_KEY);
  }

  return setItem(WIDGET_DEVICE_NAME_KEY, deviceName);
}
