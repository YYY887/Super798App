import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'drink_token';
const DEVICE_REMARK_PREFIX = 'device_remark_';

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
