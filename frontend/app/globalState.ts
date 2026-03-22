// app/globalState.ts

export const workoutData = {
  totalMinutes: 0,
  streakDays: 0,
  aiConsultationCount: 0,
  markedDates: {} as any,
  unlockedAchievements: [] as string[],
  latestAchievementId: null as string | null,
  records: [] as { date: string; minutes: number; menu: string; memo: string }[],
  equippedBadge: '🥚 はじまりの一歩',
  themeColor: '#A4C639',
  isVibrationEnabled: true,

  // ★ 修正：アバター画像（avatar）を保存する箱を追加！
  userProfile: {
    name: '筋肉太郎',
    age: '20',
    height: '170',
    weight: '65.5',
    bodyFat: '18.5',
    avatar: null as string | null, // ★ ここを追加
  },

  colorListeners: [] as ((color: string) => void)[],

  setUserProfile(profileData: Partial<typeof this.userProfile>) {
    this.userProfile = { ...this.userProfile, ...profileData };
    console.log("👤 プロフィール更新:", this.userProfile);
  },

  resetData() {
    this.totalMinutes = 0;
    this.streakDays = 0;
    this.aiConsultationCount = 0;
    this.markedDates = {};
    this.unlockedAchievements = [];
    this.latestAchievementId = null;
    this.records = [];
    this.equippedBadge = '🥚 はじまりの一歩';
    this.themeColor = '#A4C639'; 
    this.isVibrationEnabled = true;
    
    // ★ 修正：リセット時にも avatar: null に戻るように追加
    this.userProfile = { name: '筋肉太郎', age: '20', height: '170', weight: '65.5', bodyFat: '18.5', avatar: null };
    
    this.colorListeners.forEach((listener: any) => listener(this.themeColor));
    console.log("🧹 記録をリセットしました");
  },

  setVibrationEnabled(enabled: boolean) {
    this.isVibrationEnabled = enabled;
    console.log("📳 バイブレーション設定:", enabled ? "ON" : "OFF");
  },

  setThemeColor(color: string) {
    this.themeColor = color;
    const newMarkedDates = {} as any;
    Object.keys(this.markedDates).forEach((date: string) => {
      newMarkedDates[date] = { ...this.markedDates[date], selectedColor: color };
    });
    this.markedDates = newMarkedDates;
    this.colorListeners.forEach((listener: any) => listener(color));
    console.log("🎨 テーマカラー変更:", color);
  },

  subscribeColor(listener: (color: string) => void) {
    this.colorListeners.push(listener);
    return () => {
      this.colorListeners = this.colorListeners.filter((l: any) => l !== listener);
    };
  },

  incrementAiCount() {
    this.aiConsultationCount += 1;
    this.checkAchievements();
  },

  checkAchievements() {
    this.ACHIEVEMENTS.forEach((ach: any) => {
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
    this.latestAchievementId = null;
    const formattedDate = dateStr.replace(/\//g, '-');

    this.records.push({ 
      date: formattedDate, 
      minutes: mins,
      menu: menu || "トレーニング", 
      memo: memo || ""
    });

    this.totalMinutes += mins;

    if (!this.markedDates[formattedDate]) {
      const today = new Date(formattedDate);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      if (this.markedDates[yStr]) {
        this.streakDays += 1;
      } else {
        this.streakDays = 1;
      }
    }

    this.markedDates[formattedDate] = {
      selected: true,
      selectedColor: this.themeColor 
    };
    this.checkAchievements();
  },

  ACHIEVEMENTS: [
    { id: 'streak_3', icon: '🐣', name: '三日坊主の破壊者', condition: (d: any) => d.streakDays >= 3 },
    { id: 'streak_7', icon: '🔥', name: '鋼のルーティン', condition: (d: any) => d.streakDays >= 7 },
    { id: 'streak_14', icon: '🦁', name: '不屈の執念', condition: (d: any) => d.streakDays >= 14 },
    { id: 'streak_30', icon: '🏰', name: '筋肉の守護神', condition: (d: any) => d.streakDays >= 30 },
    { id: 'time_100', icon: '⭐', name: '努力の結晶', condition: (d: any) => d.totalMinutes >= 100 },
    { id: 'time_500', icon: '✨', name: '筋肉の賢者', condition: (d: any) => d.totalMinutes >= 500 },
    { id: 'ai_1', icon: '💡', name: 'AIとの共鳴', condition: (d: any) => d.aiConsultationCount >= 1 },
    { id: 'ai_5', icon: '🤝', name: 'AIマニア', condition: (d: any) => d.aiConsultationCount >= 5 },
  ],
};