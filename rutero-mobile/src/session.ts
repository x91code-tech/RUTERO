import * as SecureStore from "expo-secure-store";

const tokenKey = "rutero.mobile.token";
const deviceTokenKey = "rutero.mobile.deviceToken";

function randomToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export async function getSessionToken() {
  return SecureStore.getItemAsync(tokenKey);
}

export async function setSessionToken(token: string) {
  await SecureStore.setItemAsync(tokenKey, token);
}

export async function clearSessionToken() {
  await SecureStore.deleteItemAsync(tokenKey);
}

export async function getDeviceToken() {
  const existing = await SecureStore.getItemAsync(deviceTokenKey);
  if (existing) return existing;
  const token = randomToken();
  await SecureStore.setItemAsync(deviceTokenKey, token);
  return token;
}
