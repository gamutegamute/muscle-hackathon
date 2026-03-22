// app/globalState.ts

export const workoutData = {
  totalMinutes: 0,
  streakDays: 0,
  aiConsultationCount: 0,
  markedDates: {} as any,
  unlockedAchievements: [] as string[],
  latestAchievementId: null as string | null,
  records: [] as { date: string; minutes: number }[],
  equippedBadge: '🥚 はじまりの一歩',
  themeColor: '#A4C639', // ★ これが無いとエラーになる

  // ★ 色が変わったことを他の画面に知らせるための予約リスト
  colorListeners: [] as ((color: string) => void)[],

  // ★ データを完全に初期化するリセット関数
  resetData: () => {
    workoutData.totalMinutes = 0;
    workoutData.streakDays = 0;
    workoutData.aiConsultationCount = 0;
    workoutData.markedDates = {};
    workoutData.unlockedAchievements = [];
    workoutData.latestAchievementId = null;
    workoutData.records = [];
    workoutData.equippedBadge = '🥚 はじまりの一歩';
    workoutData.themeColor = '#A4C639'; 
    workoutData.colorListeners.forEach(listener => listener(workoutData.themeColor));
    console.log("🧹 記録をリセットしました");
  },

  // ★ テーマカラーの変更通知
  setThemeColor: (color: string) => {
    workoutData.themeColor = color;
    const newMarkedDates = {} as any;
    Object.keys(workoutData.markedDates).forEach(date => {
      newMarkedDates[date] = { ...workoutData.markedDates[date], selectedColor: color };
    });
    workoutData.markedDates = newMarkedDates;
    workoutData.colorListeners.forEach(listener => listener(color));
    console.log("🎨 テーマカラー変更:", color);
  },

  // ★ 通知の予約関数
  subscribeColor: (listener: (color: string) => void) => {
    workoutData.colorListeners.push(listener);
    return () => {
      workoutData.colorListeners = workoutData.colorListeners.filter(l => l !== listener);
    };
  },

  incrementAiCount: () => {
    workoutData.aiConsultationCount += 1;
    workoutData.checkAchievements();
  },

  checkAchievements: () => {
    workoutData.ACHIEVEMENTS.forEach(ach => {
      if (ach.condition(workoutData)) {
        workoutData.unlock(ach.id);
      }
    });
  },

  unlock: (id: string) => {
    if (!workoutData.unlockedAchievements.includes(id)) {
      workoutData.unlockedAchievements.push(id);
      workoutData.latestAchievementId = id;
    }
  },

  clearLatestAchievement: () => {
    workoutData.latestAchievementId = null;
  },

  addWorkout: (mins: number, dateStr: string) => {
    workoutData.latestAchievementId = null;
    const formattedDate = dateStr.replace(/\//g, '-');
    workoutData.records.push({ date: formattedDate, minutes: mins });
    workoutData.totalMinutes += mins;

    if (!workoutData.markedDates[formattedDate]) {
      const today = new Date(formattedDate);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      if (workoutData.markedDates[yStr]) {
        workoutData.streakDays += 1;
      } else {
        workoutData.streakDays = 1;
      }
    }

    workoutData.markedDates[formattedDate] = {
      selected: true,
      selectedColor: workoutData.themeColor 
    };
    workoutData.checkAchievements();
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