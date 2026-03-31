import { workoutData } from '@/app/globalState';

let currentGuestUserId: string | null = null;

function generateGuestUserId() {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `guest-${randomPart}`;
}

export async function ensureGuestUserId() {
  const userId = currentGuestUserId || generateGuestUserId();
  currentGuestUserId = userId;

  workoutData.setUserProfile({ userId });
  return userId;
}

export async function getStoredGuestUserId() {
  return currentGuestUserId;
}
