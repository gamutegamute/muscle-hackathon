import AsyncStorage from '@react-native-async-storage/async-storage';

import { workoutData } from '@/app/globalState';
import { removeAchievementProgress } from '@/lib/achievement-storage';

let currentGuestUserId: string | null = null;
const GUEST_SESSION_KEY = 'guest_session';

function generateGuestUserId() {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `guest-${randomPart}`;
}

export async function ensureGuestUserId() {
  const storedUserId = await getStoredGuestUserId();
  const userId = currentGuestUserId || storedUserId || generateGuestUserId();
  currentGuestUserId = userId;

  await AsyncStorage.setItem(GUEST_SESSION_KEY, userId);
  workoutData.setSessionMode('guest');
  workoutData.setUserProfile({ userId });
  return userId;
}

export async function getStoredGuestUserId() {
  if (currentGuestUserId) {
    return currentGuestUserId;
  }

  try {
    const userId = await AsyncStorage.getItem(GUEST_SESSION_KEY);
    currentGuestUserId = userId || null;
    return currentGuestUserId;
  } catch {
    return null;
  }
}

export async function restoreGuestSession() {
  const userId = await getStoredGuestUserId();
  if (!userId) {
    return null;
  }

  workoutData.setSessionMode('guest');
  workoutData.setUserProfile({ userId });
  return userId;
}

export async function clearGuestSessionMarker() {
  currentGuestUserId = null;

  try {
    await AsyncStorage.removeItem(GUEST_SESSION_KEY);
  } catch {
    // Ignore storage failures and keep the app usable.
  }
}

export async function clearGuestSessionData() {
  const userId = currentGuestUserId || (await getStoredGuestUserId());

  if (userId) {
    await removeAchievementProgress(userId);
  }

  await clearGuestSessionMarker();
}
