// frontend/lib/sound.ts
import { Audio } from 'expo-av';

const beepSource = require('./beep.mp3');

export async function playSwitchSound() {
  try {
    // 1. オーディオモードの設定
    await Audio.setAudioModeAsync({
<<<<<<< HEAD
      allowsRecordingIOS: false,
=======
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
>>>>>>> b547549396baba1595ab7e80e9e451d6df8d518f
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: true,
    });

    // 2. 音源の読み込み（importした beepSource を使います）
    const { sound } = await Audio.Sound.createAsync(beepSource);

    // 3. 再生
    await sound.playAsync();
    
    // 4. 終わったらメモリ解放
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.log("音が出せませんでした:", error);
  }
}
