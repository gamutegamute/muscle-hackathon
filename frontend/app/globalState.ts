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

const DEFAULT_USER_ID = 'guest-user';

export const workoutData = {
  totalMinutes: 0,
  todayTotalMinutes: 0,
  todayRecords: 0,
  streakDays: 0,
  aiConsultationCount: 0,
  markedDates: {} as Record<string, { selected: boolean; selectedColor: string }>,
  unlockedAchievements: [] as string[],
  latestAchievementId: null as string | null,
  records: [] as WorkoutRecord[],
  equippedBadge: '🥚 はじまりの一歩',
  themeColor: '#A4C639',
  isVibrationEnabled: true,

  userProfile: {
    userId: DEFAULT_USER_ID,
    name: '筋肉太郎',
    age: '20',
    height: '170',
    weight: '65.5',
    bodyFat: '18.5',
    avatar: null,
  } as UserProfile,

  colorListeners: [] as ((color: string) => void)[],

  getUserId() {
    return this.userProfile.userId || DEFAULT_USER_ID;
  },

  setUserProfile(profileData: Partial<UserProfile>) {
    this.userProfile = { ...this.userProfile, ...profileData };
    console.log('👤 プロフィール更新:', this.userProfile);
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
  },

  applySummary(summary: WorkoutSummary) {
    this.totalMinutes = summary.totalMinutes ?? this.totalMinutes;
    this.todayTotalMinutes = summary.todayTotalMinutes ?? this.todayTotalMinutes;
    this.todayRecords = summary.todayRecords ?? this.todayRecords;
    this.streakDays = summary.streakDays ?? this.streakDays;
    this.checkAchievements();
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

  resetData() {
    this.totalMinutes = 0;
    this.todayTotalMinutes = 0;
    this.todayRecords = 0;
    this.streakDays = 0;
    this.aiConsultationCount = 0;
    this.markedDates = {};
    this.unlockedAchievements = [];
    this.latestAchievementId = null;
    this.records = [];
    this.equippedBadge = '🥚 はじまりの一歩';
    this.themeColor = '#A4C639';
    this.isVibrationEnabled = true;
    this.userProfile = {
      userId: DEFAULT_USER_ID,
      name: '筋肉太郎',
      age: '20',
      height: '170',
      weight: '65.5',
      bodyFat: '18.5',
      avatar: null,
    };
    this.colorListeners.forEach((listener) => listener(this.themeColor));
    console.log('🧹 記録をリセットしました');
  },

  setVibrationEnabled(enabled: boolean) {
    this.isVibrationEnabled = enabled;
    console.log('📳 バイブレーション設定:', enabled ? 'ON' : 'OFF');
  },

  setThemeColor(color: string) {
    this.themeColor = color;
    const newMarkedDates: Record<string, { selected: boolean; selectedColor: string }> = {};
    Object.keys(this.markedDates).forEach((date) => {
      newMarkedDates[date] = { ...this.markedDates[date], selectedColor: color };
    });
    this.markedDates = newMarkedDates;
    this.colorListeners.forEach((listener) => listener(color));
    console.log('🎨 テーマカラー変更:', color);
  },

  subscribeColor(listener: (color: string) => void) {
    this.colorListeners.push(listener);
    return () => {
      this.colorListeners = this.colorListeners.filter((l) => l !== listener);
    };
  },

  incrementAiCount() {
    this.aiConsultationCount += 1;
    this.checkAchievements();
  },

  checkAchievements() {
    this.ACHIEVEMENTS.forEach((ach) => {
      if (ach.condition(this)) {
        this.unlock(ach.id);
      }
    });
  },

  unlock(id: string) {
    if (!this.unlockedAchievements.includes(id)) {
      this.unlockedAchievements.push(id);
      this.latestAchievementId = id;
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
    this.checkAchievements();
  },

  ACHIEVEMENTS: [
    { id: 'streak_3', icon: '🐣', name: '三日坊主の破壊者', condition: (d: typeof workoutData) => d.streakDays >= 3 },
    { id: 'streak_7', icon: '🔥', name: '鋼のルーティン', condition: (d: typeof workoutData) => d.streakDays >= 7 },
    { id: 'streak_14', icon: '🦁', name: '不屈の執念', condition: (d: typeof workoutData) => d.streakDays >= 14 },
    { id: 'streak_30', icon: '🏰', name: '筋肉の守護神', condition: (d: typeof workoutData) => d.streakDays >= 30 },
    { id: 'time_100', icon: '⭐', name: '努力の結晶', condition: (d: typeof workoutData) => d.totalMinutes >= 100 },
    { id: 'time_500', icon: '✨', name: '筋肉の賢者', condition: (d: typeof workoutData) => d.totalMinutes >= 500 },
    { id: 'ai_1', icon: '💡', name: 'AIとの共鳴', condition: (d: typeof workoutData) => d.aiConsultationCount >= 1 },
    { id: 'ai_5', icon: '🤝', name: 'AIマニア', condition: (d: typeof workoutData) => d.aiConsultationCount >= 5 },
  ],
};
