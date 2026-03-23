import { Platform } from 'react-native';

export type ApiProfile = {
  userId: string;
  name: string;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  bodyFat?: number | null;
};

export type ApiRecord = {
  recordId: string;
  userId: string;
  menuName: string;
  count: number;
  duration: number;
  durationSeconds: number;
  minutes: number;
  interval: number;
  rounds: number;
  memo: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  date: string;
  type: string;
};

export type ApiSummary = {
  userId: string;
  totalMinutes: number;
  totalRecords: number;
  todayRecords: number;
  todayTotalMinutes: number;
  streakDays: number;
  latestRecord: ApiRecord | null;
  dailyRecords: Array<{ date: string; minutes?: number; count?: number }>;
  menuSummary: Array<{ menuName: string; totalCount: number }>;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

const DEFAULT_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_BASE_URL;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getProfile(userId: string) {
  return request<ApiProfile>(`/profile/${userId}`);
}

export async function createProfile(profile: ApiProfile) {
  return request<{ message: string; data: ApiProfile }>('/profile', {
    method: 'POST',
    body: profile,
  });
}

export async function updateProfile(userId: string, profile: Partial<ApiProfile>) {
  return request<{ message: string; userId: string; updated: Partial<ApiProfile> }>(`/profile/${userId}`, {
    method: 'PATCH',
    body: profile,
  });
}

export async function upsertProfile(profile: ApiProfile) {
  try {
    await getProfile(profile.userId);
    return updateProfile(profile.userId, {
      name: profile.name,
      age: profile.age,
      height: profile.height,
      weight: profile.weight,
      bodyFat: profile.bodyFat,
    });
  } catch {
    return createProfile(profile);
  }
}

export async function getRecords(userId: string) {
  return request<{ userId: string; totalRecords: number; records: ApiRecord[] }>(`/records/${userId}`);
}

export async function getTodayRecords(userId: string) {
  return request<{ userId: string; date: string; totalRecords: number; totalMinutes: number; records: ApiRecord[] }>(
    `/records/today/${userId}`,
  );
}

export async function getSummary(userId: string) {
  return request<ApiSummary>(`/records/summary/${userId}`);
}

export async function createRecord(body: {
  userId: string;
  menuName: string;
  count: number;
  duration: number;
  interval?: number;
  rounds?: number;
  memo?: string;
  createdAt?: string;
}) {
  return request<{ message: string; data: ApiRecord }>('/records', {
    method: 'POST',
    body,
  });
}

export async function updateRecord(
  recordId: string,
  body: {
    menuName?: string;
    count?: number;
    duration?: number;
    interval?: number;
    rounds?: number;
    memo?: string;
    type?: string;
    createdAt?: string;
  },
) {
  return request<{ message: string; recordId: string; data: ApiRecord }>(`/records/${recordId}`, {
    method: 'PATCH',
    body,
  });
}

export async function getAdvice(body: {
  name: string;
  menuName: string;
  count?: number;
  duration?: number;
}) {
  return request<{ message: string; summary: { menuName: string; count?: number; duration?: number } }>(
    '/ai/advice',
    {
      method: 'POST',
      body,
    },
  );
}
