import AsyncStorage from '@react-native-async-storage/async-storage';

import { workoutData } from '@/app/globalState';
import { removeAchievementProgress } from '@/lib/achievement-storage';
import { deleteGuestProfile } from '@/lib/api';

let currentGuestUserId: string | null = null;
const GUEST_SESSION_KEY = 'guest_session';

function generateGuestUserId() {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `guest-${randomPart}`;
}

export async function ensureGuestUserId() {
  const userId = currentGuestUserId || generateGuestUserId();
  currentGuestUserId = userId;

  await clearStoredGuestSession();
  workoutData.setSessionMode('guest');
  workoutData.setUserProfile({ userId });
  return userId;
}

export async function getStoredGuestUserId() {
  return currentGuestUserId;
}

export async function restoreGuestSession() {
  await clearStoredGuestSession();
  const userId = currentGuestUserId;
  if (!userId) {
    return null;
  }

  workoutData.setSessionMode('guest');
  workoutData.setUserProfile({ userId });
  return userId;
}

export async function clearGuestSessionMarker() {
  currentGuestUserId = null;
  await clearStoredGuestSession();
}

async function clearStoredGuestSession() {
  try {
    await AsyncStorage.removeItem(GUEST_SESSION_KEY);
  } catch {
    // Ignore storage failures and keep the app usable.
  }
}

export async function clearGuestSessionData() {
  const userId = currentGuestUserId;

  if (userId) {
    try {
      await deleteGuestProfile(userId);
    } catch (error) {
      console.warn('Failed to delete guest data from backend:', error);
    }

    try {
      await removeAchievementProgress(userId);
    } catch (error) {
      console.warn('Failed to remove guest achievement progress:', error);
    }
  }

  await clearGuestSessionMarker();
}
