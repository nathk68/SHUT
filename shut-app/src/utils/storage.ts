import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getStoredData<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function setStoredData<T>(key: string, data: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function removeStoredData(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
