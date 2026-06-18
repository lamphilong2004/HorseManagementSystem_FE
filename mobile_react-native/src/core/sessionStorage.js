import AsyncStorage from "@react-native-async-storage/async-storage";

import { normalizeSession } from "./models";

const KEY = "hr_session";

export async function loadSession() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const decoded = JSON.parse(raw);
    if (!decoded || typeof decoded !== "object") return null;
    return normalizeSession(decoded);
  } catch (_error) {
    return null;
  }
}

export async function saveSession(session) {
  await AsyncStorage.setItem(KEY, JSON.stringify(session));
}

export async function clearSession() {
  await AsyncStorage.removeItem(KEY);
}
