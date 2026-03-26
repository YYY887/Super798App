import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'drink_token';
const DEVICE_REMARK_PREFIX = 'device_remark_';
const WIDGET_ENABLED_KEY = 'widget_enabled';
const WIDGET_DEVICE_ID_KEY = 'widget_device_id';

export async function getStoredToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setStoredToken(token: string) {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getDeviceRemark(deviceId: string) {
  return SecureStore.getItemAsync(`${DEVICE_REMARK_PREFIX}${deviceId}`);
}

export async function setDeviceRemark(deviceId: string, value: string) {
  const key = `${DEVICE_REMARK_PREFIX}${deviceId}`;

  if (!value) {
    return SecureStore.deleteItemAsync(key);
  }

  return SecureStore.setItemAsync(key, value);
}

export async function getWidgetEnabled() {
  const raw = await SecureStore.getItemAsync(WIDGET_ENABLED_KEY);
  return raw === '1';
}

export async function setWidgetEnabled(enabled: boolean) {
  return SecureStore.setItemAsync(WIDGET_ENABLED_KEY, enabled ? '1' : '0');
}

export async function getWidgetDeviceId() {
  return SecureStore.getItemAsync(WIDGET_DEVICE_ID_KEY);
}

export async function setWidgetDeviceId(deviceId: string) {
  if (!deviceId) {
    return SecureStore.deleteItemAsync(WIDGET_DEVICE_ID_KEY);
  }

  return SecureStore.setItemAsync(WIDGET_DEVICE_ID_KEY, deviceId);
}
