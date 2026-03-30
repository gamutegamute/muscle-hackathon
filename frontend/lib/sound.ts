// frontend/lib/sound.ts
import { Audio } from 'expo-av';

// 同じフォルダに beep.mp3 を置いている場合の読み込み
const beepSource = require('./beep.mp3');

export async function playSwitchSound() {
  try {
    // 1. オーディオ設定（一回にまとめました）
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: true,
    });

    // 2. 音源の読み込み
    const { sound } = await Audio.Sound.createAsync(beepSource);

    // 3. 再生
    await sound.playAsync();
    
    // 4. 再生が終わったらメモリを解放
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.log("音が出せませんでした:", error);
  }
}