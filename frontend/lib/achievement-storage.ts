import AsyncStorage from '@react-native-async-storage/async-storage';

type AchievementProgress = {
  unlockedAchievements: string[];
  aiConsultationCount: number;
};

const DEFAULT_PROGRESS: AchievementProgress = {
  unlockedAchievements: [],
  aiConsultationCount: 0,
};

function getStorageKey(userId: string) {
  return `achievement_progress:${userId}`;
}

export async function loadAchievementProgress(userId: string): Promise<AchievementProgress> {
  if (!userId) {
    return DEFAULT_PROGRESS;
  }

  try {
    const raw = await AsyncStorage.getItem(getStorageKey(userId));
    if (!raw) {
      return DEFAULT_PROGRESS;
    }

    const parsed = JSON.parse(raw) as Partial<AchievementProgress>;
    return {
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
        ? parsed.unlockedAchievements.filter((value): value is string => typeof value === 'string')
        : [],
      aiConsultationCount:
        typeof parsed.aiConsultationCount === 'number' && Number.isFinite(parsed.aiConsultationCount)
          ? parsed.aiConsultationCount
          : 0,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export async function saveAchievementProgress(userId: string, progress: AchievementProgress) {
  if (!userId) {
    return;
  }

  try {
    await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(progress));
  } catch {
    // Ignore storage failures and keep the app usable.
  }
}

export async function removeAchievementProgress(userId: string) {
  if (!userId) {
    return;
  }

  try {
    await AsyncStorage.removeItem(getStorageKey(userId));
  } catch {
    // Ignore storage failures and keep the app usable.
  }
}
