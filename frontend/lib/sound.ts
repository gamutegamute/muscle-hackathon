// frontend/lib/sound.ts
import { Audio } from 'expo-av';



export async function playSwitchSound() {
  try {
    await Audio.setAudioModeAsync({
     allowsRecordingIOS: false,
     playsInSilentModeIOS: true, // マナーモードでも鳴らすか（好み）
     shouldDuckAndroid: true,    // 音が鳴る時に他の音量を下げる
     staysActiveInBackground: true, // バックグラウンドでも維持
});
    // assetsフォルダのパスを正しく指定します
    const { sound } = await Audio.Sound.createAsync(
       require('@/assets/images/beep.mp3') 
    );

    // 他のアプリ（音楽など）を邪魔しないための設定
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    await sound.playAsync();
    
    sound.setOnPlaybackStatusUpdate((status) => {
      // 型チェックを行いながらアンロード
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.log("音が出せませんでした:", error);
  }
}
