import { loadAchievementProgress, saveAchievementProgress } from '@/lib/achievement-storage';

export type WorkoutRecord = {
  recordId: string;
  date: string;
  minutes: number;
  menu: string;
  memo: string;
  count: number;
  durationSeconds: number;
  interval: number;
  rounds: number;
  type: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type WorkoutSummary = {
  totalMinutes?: number;
  streakDays?: number;
  todayTotalMinutes?: number;
  todayRecords?: number;
};

type UserProfile = {
  userId: string;
  name: string;
  age: string;
  height: string;
  weight: string;
  bodyFat: string;
  avatar: string | null;
};

type AchievementDefinition = {
  id: string;
  icon: string;
  name: string;
  condition: (data: {
    maxStreakDays: number;
    totalMinutes: number;
    aiConsultationCount: number;
  }) => boolean;
};

export type SessionMode = 'logged_out' | 'guest' | 'registered';

const DEFAULT_USER_ID = 'guest-user';
const DEFAULT_BADGE = '🥚 はじまりの一歩';

function calculateMaxStreakDays(dates: string[]) {
  const normalizedDates = Array.from(
    new Set(
      dates
        .filter((date): date is string => Boolean(date))
        .map((date) => date.slice(0, 10)),
    ),
  ).sort();

  if (normalizedDates.length === 0) {
    return 0;
  }

  let currentStreak = 1;
  let maxStreak = 1;

  for (let index = 1; index < normalizedDates.length; index += 1) {
    const previous = new Date(`${normalizedDates[index - 1]}T00:00:00`);
    const current = new Date(`${normalizedDates[index]}T00:00:00`);
    const diffDays = Math.round((current.getTime() - previous.getTime()) / 86400000);

    if (diffDays === 1) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

export const workoutData = {
  totalMinutes: 0,
  todayTotalMinutes: 0,
  todayRecords: 0,
  streakDays: 0,
  maxStreakDays: 0,
  aiConsultationCount: 0,
  markedDates: {} as Record<string, { selected: boolean; selectedColor: string }>,
  unlockedAchievements: [] as string[],
  latestAchievementId: null as string | null,
  achievementProgressLoadedForUserId: null as string | null,
  records: [] as WorkoutRecord[],
  equippedBadge: DEFAULT_BADGE,
  themeColor: '#A4C639',
  isVibrationEnabled: true,
  sessionMode: 'logged_out' as SessionMode,

  userProfile: {
    userId: DEFAULT_USER_ID,
    name: 'ゲスト',
    age: '',
    height: '',
    weight: '',
    bodyFat: '',
    avatar: null,
  } as UserProfile,

  colorListeners: [] as ((color: string) => void)[],
  dataListeners: [] as (() => void)[],

  getUserId() {
    return this.userProfile.userId || DEFAULT_USER_ID;
  },

  isGuestUser() {
    return this.sessionMode === 'guest';
  },

  setSessionMode(mode: SessionMode) {
    this.sessionMode = mode;
  },

  setUserProfile(profileData: Partial<UserProfile>) {
    const nextUserId = profileData.userId;
    if (nextUserId && nextUserId !== this.userProfile.userId) {
      this.totalMinutes = 0;
      this.todayTotalMinutes = 0;
      this.todayRecords = 0;
      this.streakDays = 0;
      this.unlockedAchievements = [];
      this.latestAchievementId = null;
      this.maxStreakDays = 0;
      this.aiConsultationCount = 0;
      this.achievementProgressLoadedForUserId = null;
      this.records = [];
      this.markedDates = {};
      this.equippedBadge = '';
    }

    this.userProfile = { ...this.userProfile, ...profileData };
    this.dataListeners.forEach((listener) => listener());
    console.log('プロフィール更新:', this.userProfile);
  },

  setRecords(records: WorkoutRecord[]) {
    this.records = records.map((record) => ({
      recordId: record.recordId,
      date: record.date,
      minutes: record.minutes,
      menu: record.menu,
      memo: record.memo,
      count: record.count,
      durationSeconds: record.durationSeconds,
      interval: record.interval,
      rounds: record.rounds,
      type: record.type,
      createdAt: record.createdAt ?? null,
      updatedAt: record.updatedAt ?? null,
    }));

    const newMarkedDates: Record<string, { selected: boolean; selectedColor: string }> = {};
    this.records.forEach((record) => {
      if (record.date) {
        newMarkedDates[record.date] = {
          selected: true,
          selectedColor: this.themeColor,
        };
      }
    });
    this.markedDates = newMarkedDates;
    this.maxStreakDays = calculateMaxStreakDays(this.records.map((record) => record.date));
    this.dataListeners.forEach((listener) => listener());
  },

  applySummary(summary: WorkoutSummary) {
    this.totalMinutes = summary.totalMinutes ?? this.totalMinutes;
    this.todayTotalMinutes = summary.todayTotalMinutes ?? this.todayTotalMinutes;
    this.todayRecords = summary.todayRecords ?? this.todayRecords;
    this.streakDays = summary.streakDays ?? this.streakDays;
    this.checkAchievements();
    this.dataListeners.forEach((listener) => listener());
  },

  replaceAll(data: {
    profile?: Partial<UserProfile>;
    records?: WorkoutRecord[];
    summary?: WorkoutSummary;
  }) {
    if (data.profile) {
      this.setUserProfile(data.profile);
    }
    if (data.records) {
      this.setRecords(data.records);
    }
    if (data.summary) {
      this.applySummary(data.summary);
    }
  },

  resetData(options?: { userId?: string; sessionMode?: SessionMode }) {
    const nextUserId = options?.userId ?? '';
    this.totalMinutes = 0;
    this.todayTotalMinutes = 0;
    this.todayRecords = 0;
    this.streakDays = 0;
    this.maxStreakDays = 0;
    this.aiConsultationCount = 0;
    this.markedDates = {};
    this.unlockedAchievements = [];
    this.latestAchievementId = null;
    this.achievementProgressLoadedForUserId = null;
    this.records = [];
    this.equippedBadge = '';
    this.themeColor = '#A4C639';
    this.isVibrationEnabled = true;
    this.sessionMode = options?.sessionMode ?? 'logged_out';
    this.userProfile = {
      userId: nextUserId,
      name: 'ゲスト',
      age: '',
      height: '',
      weight: '',
      bodyFat: '',
      avatar: null,
    };
    this.colorListeners.forEach((listener) => listener(this.themeColor));
    this.dataListeners.forEach((listener) => listener());
    console.log('記録データをリセットしました');
  },

  setVibrationEnabled(enabled: boolean) {
    this.isVibrationEnabled = enabled;
    console.log('バイブレーション設定:', enabled ? 'ON' : 'OFF');
  },

  setThemeColor(color: string) {
    this.themeColor = color;
    const newMarkedDates: Record<string, { selected: boolean; selectedColor: string }> = {};
    Object.keys(this.markedDates).forEach((date) => {
      newMarkedDates[date] = { ...this.markedDates[date], selectedColor: color };
    });
    this.markedDates = newMarkedDates;
    this.colorListeners.forEach((listener) => listener(color));
    this.dataListeners.forEach((listener) => listener());
    console.log('テーマカラー更新:', color);
  },

  subscribeColor(listener: (color: string) => void) {
    this.colorListeners.push(listener);
    return () => {
      this.colorListeners = this.colorListeners.filter((l) => l !== listener);
    };
  },

  subscribeData(listener: () => void) {
    this.dataListeners.push(listener);
    return () => {
      this.dataListeners = this.dataListeners.filter((l) => l !== listener);
    };
  },

  async ensureAchievementProgressLoaded() {
    const userId = this.getUserId();
    if (!userId || this.achievementProgressLoadedForUserId === userId) {
      return;
    }

    const progress = await loadAchievementProgress(userId);
    this.unlockedAchievements = [...progress.unlockedAchievements];
    this.aiConsultationCount = progress.aiConsultationCount;
    this.latestAchievementId = null;
    this.achievementProgressLoadedForUserId = userId;
  },

  persistAchievementProgress() {
    const userId = this.getUserId();
    this.achievementProgressLoadedForUserId = userId;
    void saveAchievementProgress(userId, {
      unlockedAchievements: [...this.unlockedAchievements],
      aiConsultationCount: this.aiConsultationCount,
    });
  },

  incrementAiCount() {
    this.aiConsultationCount += 1;
    this.checkAchievements();
    this.persistAchievementProgress();
  },

  checkAchievements() {
    this.ACHIEVEMENTS.forEach((achievement) => {
      if (achievement.condition(this)) {
        this.unlock(achievement.id);
      }
    });
  },

  unlock(id: string) {
    if (!this.unlockedAchievements.includes(id)) {
      this.unlockedAchievements.push(id);
      this.latestAchievementId = id;
      this.persistAchievementProgress();
    }
  },

  clearLatestAchievement() {
    this.latestAchievementId = null;
  },

  addWorkout(mins: number, dateStr: string, menu: string, memo: string) {
    const normalizedDate = dateStr.replace(/\//g, '-');
    const derivedRecord: WorkoutRecord = {
      recordId: '',
      date: normalizedDate,
      minutes: mins,
      menu: menu || 'トレーニング',
      memo: memo || '',
      count: 0,
      durationSeconds: mins * 60,
      interval: 0,
      rounds: 1,
      type: 'normal',
    };

    this.setRecords([...this.records, derivedRecord]);
    this.totalMinutes += mins;
    this.todayTotalMinutes += mins;
    this.todayRecords += 1;

    const today = new Date(normalizedDate);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    this.streakDays = this.markedDates[yStr] ? Math.max(this.streakDays, 1) + 1 : Math.max(this.streakDays, 1);
    this.maxStreakDays = Math.max(this.maxStreakDays, this.streakDays);
    this.checkAchievements();
    this.dataListeners.forEach((listener) => listener());
  },

  ACHIEVEMENTS: [
    { id: 'streak_3', icon: '🔥', name: '3日連続の挑戦者', condition: (d) => d.maxStreakDays >= 3 },
    { id: 'streak_7', icon: '🌟', name: '継続のルーキー', condition: (d) => d.maxStreakDays >= 7 },
    { id: 'streak_14', icon: '💪', name: '2週間の努力家', condition: (d) => d.maxStreakDays >= 14 },
    { id: 'streak_30', icon: '👑', name: '筋肉の王者', condition: (d) => d.maxStreakDays >= 30 },
    { id: 'time_100', icon: '⏱️', name: '努力の積み上げ', condition: (d) => d.totalMinutes >= 100 },
    { id: 'time_500', icon: '🏅', name: '筋肉の勲章', condition: (d) => d.totalMinutes >= 500 },
    { id: 'ai_1', icon: '🤖', name: 'AIとの出会い', condition: (d) => d.aiConsultationCount >= 1 },
    { id: 'ai_5', icon: '🧠', name: 'AIマニア', condition: (d) => d.aiConsultationCount >= 5 },
  ] as AchievementDefinition[],
};
