// frontend/lib/sound.ts
import { Audio } from 'expo-av';

const beepSource = require('./beep.mp3');

export async function playSwitchSound() {
  try {
    // 1. オーディオモードの設定
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
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