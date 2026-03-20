// app/globalState.ts

export const workoutData = {
  totalMinutes: 0, // 初期値 0
  streakDays: 0,   // 初期値 0
  markedDates: {} as any, // 初期は印なし
  
  // データを保存し、加算する関数
  addWorkout: (mins: number, dateStr: string) => {
    // 時間を加算
    workoutData.totalMinutes += mins;
    
    // 日付をカレンダー形式 (YYYY-MM-DD) に変換して印をつける
    const formattedDate = dateStr.replace(/\//g, '-'); 
    
    // すでに今日記録していなければ、継続日数をカウントアップ
    if (!workoutData.markedDates[formattedDate]) {
      workoutData.streakDays += 1;
    }
    
    workoutData.markedDates[formattedDate] = { 
      selected: true, 
      selectedColor: '#A4C639' 
    };

    console.log('--- データ更新完了 ---');
    console.log('累計時間:', workoutData.totalMinutes);
    console.log('継続日数:', workoutData.streakDays);
  }
};