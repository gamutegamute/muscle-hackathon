import { Alert } from 'react-native';

import { workoutData, type WorkoutRecord } from '@/app/globalState';
import {
  type ApiRecord,
  API_BASE_URL,
  getProfile,
  getRecords,
  getSummary,
  getTodayRecords,
  upsertProfile,
  createRecord,
  updateRecord,
} from '@/lib/api';
import { auth } from '@/lib/firebase-client';
import { getExpoPushToken } from '@/lib/push-notifications';

function toLocalRecord(record: ApiRecord): WorkoutRecord {
  return {
    recordId: record.recordId,
    date: record.date,
    minutes: record.minutes,
    menu: record.menuName,
    memo: record.memo,
    count: record.count,
    durationSeconds: record.durationSeconds,
    interval: record.interval,
    rounds: record.rounds,
    type: record.type,
    createdAt: record.createdAt ?? null,
    updatedAt: record.updatedAt ?? null,
  };
}

export function getApiConnectionHelpMessage() {
  return `バックエンドに接続できませんでした。\n\n現在の接続先:\n${API_BASE_URL}\n\nPC実機確認のときは EXPO_PUBLIC_API_BASE_URL を自分のPCのIPに合わせてください。`;
}

export async function syncWorkoutData(options?: { showAlert?: boolean }) {
  try {
    await workoutData.ensureAchievementProgressLoaded();

    const userId = workoutData.getUserId();
    const [recordsResponse, summaryResponse, todayResponse] = await Promise.all([
      getRecords(userId),
      getSummary(userId),
      getTodayRecords(userId),
    ]);

    workoutData.setRecords(recordsResponse.records.map(toLocalRecord));
    workoutData.applySummary({
      totalMinutes: summaryResponse.totalMinutes,
      streakDays: summaryResponse.streakDays,
      todayRecords: todayResponse.totalRecords,
      todayTotalMinutes: todayResponse.totalMinutes,
    });

    try {
      const profile = await getProfile(userId);
      if (profile.themeColor) {
        workoutData.setThemeColor(profile.themeColor);
      }
      if (typeof profile.isVibrationEnabled === 'boolean') {
        workoutData.setVibrationEnabled(profile.isVibrationEnabled);
      }
      if (profile.equippedBadge) {
        workoutData.equippedBadge = profile.equippedBadge;
      }
      workoutData.setUserProfile({
        userId: profile.userId,
        friendId: profile.friendId ?? workoutData.userProfile.friendId,
        name: profile.name ?? workoutData.userProfile.name,
        age: profile.age != null ? String(profile.age) : '',
        height: profile.height != null ? String(profile.height) : '',
        weight: profile.weight != null ? String(profile.weight) : '',
        bodyFat: profile.bodyFat != null ? String(profile.bodyFat) : '',
        avatar: profile.avatar ?? workoutData.userProfile.avatar,
      });
    } catch {
      // プロフィール未作成は許容
    }

    return {
      records: recordsResponse.records.map(toLocalRecord),
      summary: summaryResponse,
      today: todayResponse,
    };
  } catch (error) {
    if (options?.showAlert) {
      Alert.alert('接続エラー', getApiConnectionHelpMessage());
    }
    throw error;
  }
}

export async function saveProfileToBackend(profile: {
  name: string;
  age?: string;
  height?: string;
  weight?: string;
  bodyFat?: string;
  avatar?: string | null;
  themeColor?: string | null;
  equippedBadge?: string | null;
  isVibrationEnabled?: boolean;
}, options?: { requestNotificationPermission?: boolean }) {
  const userId = workoutData.getUserId();
  let expoPushToken: string | null | undefined;

  try {
    expoPushToken = await getExpoPushToken({
      requestPermissionIfNeeded: options?.requestNotificationPermission ?? false,
    });
  } catch (error) {
    console.warn('Failed to get Expo push token:', error);
  }

  const normalizeOptionalNumericField = (value?: string) => {
    if (value === undefined) {
      return undefined;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return null;
    }

    return Number(trimmedValue);
  };

  await upsertProfile({
    userId,
    name: profile.name,
    age: normalizeOptionalNumericField(profile.age),
    height: normalizeOptionalNumericField(profile.height),
    weight: normalizeOptionalNumericField(profile.weight),
    bodyFat: normalizeOptionalNumericField(profile.bodyFat),
    expoPushToken,
    avatar: profile.avatar ?? workoutData.userProfile.avatar,
    themeColor: profile.themeColor ?? workoutData.themeColor,
    equippedBadge: profile.equippedBadge ?? workoutData.equippedBadge,
    isVibrationEnabled: profile.isVibrationEnabled ?? workoutData.isVibrationEnabled,
  });

  workoutData.setUserProfile({
    userId,
    friendId: workoutData.userProfile.friendId,
    name: profile.name,
    age: profile.age ?? workoutData.userProfile.age,
    height: profile.height ?? workoutData.userProfile.height,
    weight: profile.weight ?? workoutData.userProfile.weight,
    bodyFat: profile.bodyFat ?? workoutData.userProfile.bodyFat,
    avatar: profile.avatar ?? workoutData.userProfile.avatar,
  });
  if (profile.themeColor) {
    workoutData.setThemeColor(profile.themeColor);
  }
  if (profile.equippedBadge) {
    workoutData.equippedBadge = profile.equippedBadge;
  }
  if (typeof profile.isVibrationEnabled === 'boolean') {
    workoutData.setVibrationEnabled(profile.isVibrationEnabled);
  }
}

export async function saveRecordToBackend(input: {
  recordId?: string;
  dateStr: string;
  timeStr?: string;
  menu: string;
  memo: string;
  count: number;
  durationSeconds: number;
  interval?: number;
  rounds?: number;
}) {
  const firebaseUserId = auth.currentUser?.uid;
  let userId = workoutData.getUserId();

  if (firebaseUserId) {
    userId = firebaseUserId;
    workoutData.setSessionMode('registered');
    workoutData.setUserProfile({ userId });
  } else if (workoutData.sessionMode !== 'guest' || !userId.startsWith('guest-')) {
    const { startNewGuestSession } = await import('@/lib/guest-session');
    userId = await startNewGuestSession();
  }

  const durationSeconds = Math.max(0, input.durationSeconds);
  const normalizedDate = input.dateStr.replace(/\//g, '-');
  const normalizedTime = input.timeStr || '00:00';
  const createdAt = `${normalizedDate}T${normalizedTime}:00+09:00`;

  if (input.recordId) {
    await updateRecord(input.recordId, {
      menuName: input.menu,
      count: input.count,
      duration: durationSeconds,
      interval: input.interval ?? 0,
      rounds: input.rounds ?? 1,
      memo: input.memo,
      createdAt,
    });
  } else {
    await createRecord({
      userId,
      menuName: input.menu,
      count: input.count,
      duration: durationSeconds,
      interval: input.interval ?? 0,
      rounds: input.rounds ?? 1,
      memo: input.memo,
      createdAt,
    });
  }

  return syncWorkoutData();
}
