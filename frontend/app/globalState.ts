// app/globalState.ts

export const workoutData = {
  totalMinutes: 0,
  streakDays: 0,
  aiConsultationCount: 0,
  markedDates: {} as any,
  unlockedAchievements: [] as string[],
  latestAchievementId: null as string | null, 

  ACHIEVEMENTS: [
    { id: 'streak_3', name: '⚡ 三日坊主の破壊者', icon: 'zap', condition: (d: any) => d.streakDays >= 3, isRare: false },
    { id: 'streak_7', name: '🛡️ 鋼のルーティン', icon: 'shield', condition: (d: any) => d.streakDays >= 7, isRare: true },
    { id: 'streak_14', name: '⛓️ 不屈の執念', icon: 'link', condition: (d: any) => d.streakDays >= 14, isRare: false },
    { id: 'streak_30', name: '👑 筋肉の守護神', icon: 'crown', condition: (d: any) => d.streakDays >= 30, isRare: true },
    { id: 'time_100', name: '💎 努力の結晶', icon: 'gem', condition: (d: any) => d.totalMinutes >= 100, isRare: true },
    { id: 'time_500', name: '🧠 筋肉の賢者', icon: 'brain', condition: (d: any) => d.totalMinutes >= 500, isRare: true },
    { id: 'ai_1', name: '🤖 AIの弟子', icon: 'robot', condition: (d: any) => d.aiConsultationCount >= 1, isRare: false },
    { id: 'ai_5', name: '🧠 理論派トレーニー', icon: 'book', condition: (d: any) => d.aiConsultationCount >= 5, isRare: true },
    { id: 'early_bird', name: '☀️ 暁のパンプアップ', icon: 'sun', condition: null, isRare: false }, 
    { id: 'night_owl', name: '🌙 真夜中の鉄使い', icon: 'moon', condition: null, isRare: false },
  ],

  checkAchievements: () => {
    workoutData.ACHIEVEMENTS.forEach(ach => {
      if (ach.condition && ach.condition(workoutData)) {
        workoutData.unlock(ach.id);
      }
    });
  },

  // ★ AI画面でこれを呼んでいるので必須です
  incrementAiCount: () => {
    workoutData.aiConsultationCount += 1;
    workoutData.checkAchievements();
  },

  addWorkout: (mins: number, dateStr: string) => {
    workoutData.latestAchievementId = null;
    workoutData.totalMinutes += mins;
    const formattedDate = dateStr.replace(/\//g, '-'); 
    if (!workoutData.markedDates[formattedDate]) {
      workoutData.streakDays += 1;
    }
    workoutData.markedDates[formattedDate] = { selected: true, selectedColor: '#A4C639' };

    const currentHour = new Date().getHours();
    if (currentHour >= 4 && currentHour <= 7) workoutData.unlock('early_bird');
    else if (currentHour >= 23 || currentHour <= 3) workoutData.unlock('night_owl');

    workoutData.checkAchievements();
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

  getLatestAchievement: () => {
    if (workoutData.unlockedAchievements.length === 0) return { name: '🥚 最初の一歩', icon: 'egg' };
    const lastId = workoutData.unlockedAchievements[workoutData.unlockedAchievements.length - 1];
    const ach = workoutData.ACHIEVEMENTS.find(a => a.id === lastId);
    return ach ? { name: ach.name, icon: ach.icon } : { name: '🥚 最初の一歩', icon: 'egg' };
  }
};