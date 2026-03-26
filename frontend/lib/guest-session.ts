import AsyncStorage from '@react-native-async-storage/async-storage';

import { workoutData } from '@/app/globalState';

const GUEST_USER_ID_KEY = 'guest_user_id';

function generateGuestUserId() {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `guest-${randomPart}`;
}

export async function ensureGuestUserId() {
  const existingUserId = await AsyncStorage.getItem(GUEST_USER_ID_KEY);
  const userId = existingUserId || generateGuestUserId();

  if (!existingUserId) {
    await AsyncStorage.setItem(GUEST_USER_ID_KEY, userId);
  }

  workoutData.setUserProfile({ userId });
  return userId;
}

export async function getStoredGuestUserId() {
  return AsyncStorage.getItem(GUEST_USER_ID_KEY);
}
