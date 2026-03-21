// app/globalState.tsx
export const workoutData = {
  totalMinutes: 0,
  streakDays: 0,
  aiConsultationCount: 0,
  markedDates: {} as any,
  unlockedAchievements: [] as string[],
  latestAchievementId: null as string | null,

  records: [] as { date: string; minutes: number }[],

  equippedBadge: '🥚 はじまりの一歩',

  ACHIEVEMENTS: [
    { id: 'streak_3', name: '⚡ 三日坊主の破壊者', condition: (d: any) => d.streakDays >= 3 },
    { id: 'streak_7', name: '🛡️ 鋼のルーティン', condition: (d: any) => d.streakDays >= 7 },
    { id: 'streak_14', name: '⛓️ 不屈の執念', condition: (d: any) => d.streakDays >= 14 },
    { id: 'streak_30', name: '👑 筋肉の守護神', condition: (d: any) => d.streakDays >= 30 },
    { id: 'time_100', name: '💎 努力の結晶', condition: (d: any) => d.totalMinutes >= 100 },
    { id: 'time_500', name: '🧠 筋肉の賢者', condition: (d: any) => d.totalMinutes >= 500 },
  ],

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

      console.log("🏆 実績解除:", id);
    }
  },

  clearLatestAchievement: () => {
    workoutData.latestAchievementId = null;
  },

  addWorkout: (mins: number, dateStr: string) => {
    workoutData.latestAchievementId = null;

    const formattedDate = new Date(dateStr.replace(/\//g, '-'))
      .toISOString()
      .split('T')[0];

    // 🔥 records保存（グラフ用）
    workoutData.records.push({
      date: formattedDate,
      minutes: mins
    });

    // 累計
    workoutData.totalMinutes += mins;

    // 🔥 streak修正（ここが重要）
    const today = new Date(formattedDate);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const yStr = yesterday.toISOString().split('T')[0];

    if (workoutData.markedDates[yStr]) {
      workoutData.streakDays += 1;
    } else {
      workoutData.streakDays = 1;
    }

    workoutData.markedDates[formattedDate] = {
      selected: true,
      selectedColor: '#A4C639'
    };

    workoutData.checkAchievements();
  }
};


