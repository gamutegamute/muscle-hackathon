import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Vibration,
} from 'react-native';
import { workoutData } from '../globalState';

const COLORS = {
  primaryGreen: '#A4C639',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayBackground: '#E0E0E0',
  grayText: '#757575',
  accentRed: '#FF5252',
  accentBlue: '#2196F3',
};

const ITEM_WIDTH = 45; 
const NUMBER_DATA = Array.from({ length: 101 }, (_, i) => i);
const SET_DATA = Array.from({ length: 21 }, (_, i) => i);
const SEC_DATA = Array.from({ length: 60 }, (_, i) => i);

// --- 横スクロールピッカー ---
const WorkoutPicker = React.memo(({ data, currentVal, onSelect, pickerRef }: any) => {
  const [pickerWidth, setPickerWidth] = useState(0);
  const sidePadding = pickerWidth ? (pickerWidth - ITEM_WIDTH) / 2 : 0;

  return (
    <View style={styles.pickerWrapper} onLayout={(e) => setPickerWidth(e.nativeEvent.layout.width)}>
      <View style={styles.centerIndicator} pointerEvents="none" />
      {pickerWidth > 0 && (
        <FlatList
          ref={pickerRef}
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.toString()}
          snapToInterval={ITEM_WIDTH}
          snapToOffsets={data.map((_: any, i: number) => i * ITEM_WIDTH)} 
          snapToAlignment="start" 
          initialScrollIndex={currentVal}
          getItemLayout={(_, index) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index })}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const index = Math.round(x / ITEM_WIDTH);
            if (index >= 0 && index < data.length) onSelect(data[index]);
          }}
          contentContainerStyle={{ paddingHorizontal: sidePadding }}
          renderItem={({ item }) => (
            <View style={styles.numberItem}>
              <Text style={[styles.numberText, currentVal === item && styles.activeNumberText]}>
                {item}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
});

// --- ステッパー ---
const Stepper = ({ label, value, onUpdate, min = 0, max = 99, unit = "" }: any) => (
  <View style={styles.stepperContainer}>
    {label !== "" && <Text style={styles.stepperLabel}>{label}</Text>}
    <View style={styles.stepperRow}>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onUpdate(Math.max(min, value - 1))}>
        <Ionicons name="remove" size={20} color={COLORS.text} />
      </TouchableOpacity>
      <View style={styles.valueBox}>
        <Text style={styles.valueText}>{String(value).padStart(2, '0')}</Text>
        {unit !== "" && <Text style={styles.unitText}>{unit}</Text>}
      </View>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onUpdate(Math.min(max, value + 1))}>
        <Ionicons name="add" size={20} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  </View>
);

export default function DetailedRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('input');

  // 共通
  const [menu, setMenu] = useState('');
  const [dateStr, setDateStr] = useState("");
  const [memo, setMemo] = useState('');

  // 手動入力
  const [count, setCount] = useState(10);
  const [sets, setSets] = useState(3);
  const [mins, setMins] = useState(0);
  const [secs, setSecs] = useState(30);

  // タイマー設定（初期値）
  const [workMin, setWorkMin] = useState(0);
  const [workSec, setWorkSec] = useState(30);
  const [restMin, setRestMin] = useState(0);
  const [restSec, setRestSec] = useState(10);
  const [rounds, setRounds] = useState(3);

  // 実行状態
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<'IDLE' | 'WORK' | 'REST' | 'FINISH'>('IDLE');
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [swTime, setSwTime] = useState(0);

  const timerRef = useRef<any>(null);
  const swRef = useRef<any>(null);
  const countRef = useRef<FlatList>(null);
  const setsRef = useRef<FlatList>(null);
  const minsRef = useRef<FlatList>(null); // ★追加：分数がフリーズするバグの修正
  const secsRef = useRef<FlatList>(null); // ★追加：秒数がフリーズするバグの修正

  // --- AIオート入力 & 初期化 ---
  useEffect(() => {
    const now = new Date();
    setDateStr(`${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`);
    
    if (params.menu) {
      setMenu(params.menu as string);
      
      const countVal = params.count ? Number(params.count) : 10;
      setCount(countVal);

      const setsVal = params.sets ? Number(params.sets) : 3;
      setSets(setsVal);
      setRounds(setsVal); // タイマーにも同期

      // ★修正：時間が0になるのを防ぐ（AIから指定がなければ最低30秒にする）
      let mVal = params.mins ? Number(params.mins) : 0;
      let sVal = params.secs ? Number(params.secs) : 30;
      if (mVal === 0 && sVal === 0) sVal = 30;

      setMins(mVal);
      setSecs(sVal);
      setWorkMin(mVal);
      setWorkSec(sVal);

      // インターバル時間の反映
      let restSVal = params.interval ? Number(params.interval) : 10;
      setRestMin(Math.floor(restSVal / 60));
      setRestSec(restSVal % 60);

      // ★修正：ピッカーがフリーズしないように、確実にスクロールさせる
      setTimeout(() => {
        try {
          countRef.current?.scrollToIndex({ index: countVal, animated: true });
          setsRef.current?.scrollToIndex({ index: setsVal, animated: true });
          minsRef.current?.scrollToIndex({ index: mVal, animated: true });
          secsRef.current?.scrollToIndex({ index: sVal, animated: true });
        } catch (e) {
          console.log("Scroll adjustment pending");
        }
      }, 500);
    }
  }, [params]);

  // 保存共通ロジック（AIチェック付き）
  const validateAndSave = (finalMins: number) => {
    if (!menu.trim()) {
      Alert.alert('メニューが未入力です','AIに相談してみますか？',
        [
          { text: '自分で入力する', style: 'cancel' },
          { text: 'AIに相談する 🤖', onPress: () => router.push('/ai') },
        ]
      );
      return;
    }
    workoutData.addWorkout(finalMins || 1, dateStr);
    router.push('/record_complete');
  };

  // タイマー制御
  const startTimer = () => {
    const total = workMin * 60 + workSec;
    if (total === 0) return;
    setIsRunning(true);
    setPhase('WORK');
    setTimeLeft(total);
    setCurrentRound(1);
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setPhase('IDLE');
    setTimeLeft(0);
  };

  useEffect(() => {
    if (isRunning && activeTab === 'timer' && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (isRunning && activeTab === 'timer' && timeLeft === 0) {
      Vibration.vibrate(500);
      if (phase === 'WORK') {
        if (currentRound < rounds) {
          setPhase('REST');
          setTimeLeft(restMin * 60 + restSec);
        } else {
          setIsRunning(false);
          setPhase('FINISH');
        }
      } else if (phase === 'REST') {
        setCurrentRound(r => r + 1);
        setPhase('WORK');
        setTimeLeft(workMin * 60 + workSec);
      }
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft, phase, activeTab]);

  const confirmResetTimer = () => {
    Alert.alert("リセットしますか？", "現在の進行状況が破棄されます。", [
      { text: "キャンセル", style: "cancel" },
      { text: "リセット", style: "destructive", onPress: resetTimer }
    ]);
  };

  // ストップウォッチ
  useEffect(() => {
    if (isRunning && activeTab === 'stopwatch') {
      swRef.current = setInterval(() => setSwTime(t => t + 1), 1000);
    } else {
      clearInterval(swRef.current);
    }
    return () => clearInterval(swRef.current);
  }, [isRunning, activeTab]);

  const confirmResetStopwatch = () => {
    Alert.alert("リセットしますか？", "現在の計測タイムが消去されます。", [
      { text: "キャンセル", style: "cancel" },
      { text: "リセット", style: "destructive", onPress: () => { setIsRunning(false); setSwTime(0); }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>記録</Text>
        {activeTab === 'input' && (
          <TouchableOpacity style={styles.saveBtn} onPress={() => validateAndSave(mins + (secs > 0 ? 1 : 0))}>
            <Text style={styles.saveBtnText}>保存</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.tabContainer}>
          {['input', 'timer', 'stopwatch'].map((t) => (
            <TouchableOpacity 
              key={t} 
              style={[styles.tab, activeTab === t && styles.activeTab]} 
              onPress={() => { setActiveTab(t); setIsRunning(false); setPhase('IDLE'); }}
            >
              <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>
                {t === 'input' ? '手動入力' : t === 'timer' ? 'タイマー' : 'ストップウォッチ'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={styles.menuInput} placeholder="メニュー名（例：スクワット）" placeholderTextColor={COLORS.grayText} value={menu} onChangeText={setMenu} />

        {activeTab === 'input' ? (
          <View>
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>回数: <Text style={styles.highlight}>{count}</Text></Text>
                <WorkoutPicker data={NUMBER_DATA} currentVal={count} onSelect={setCount} pickerRef={countRef} />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>セット: <Text style={styles.highlight}>{sets}</Text></Text>
                <WorkoutPicker data={SET_DATA} currentVal={sets} onSelect={setSets} pickerRef={setsRef} />
              </View>
            </View>
            <View style={styles.timeSection}>
              <Text style={styles.label}>時間: <Text style={styles.highlight}>{mins}分 {secs}秒</Text></Text>
              <View style={styles.timePickers}>
                {/* ★修正：minsRefとsecsRefを紐づけてフリーズバグを解消 */}
                <View style={{flex:1}}><WorkoutPicker data={NUMBER_DATA} currentVal={mins} onSelect={setMins} pickerRef={minsRef} /></View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={{flex:1}}><WorkoutPicker data={SEC_DATA} currentVal={secs} onSelect={setSecs} pickerRef={secsRef} /></View>
              </View>
            </View>
          </View>
        ) : activeTab === 'timer' ? (
          <View style={styles.card}>
            {phase === 'IDLE' ? (
              <View>
                <Stepper label="① トレーニング時間" value={workMin} onUpdate={setWorkMin} unit="分" />
                <Stepper label="" value={workSec} onUpdate={setWorkSec} unit="秒" max={59} />
                <View style={styles.divider} />
                <Stepper label="② インターバル時間" value={restMin} onUpdate={setRestMin} unit="分" />
                <Stepper label="" value={restSec} onUpdate={setRestSec} unit="秒" max={59} />
                <View style={styles.divider} />
                <Stepper label="③ 周回数" value={rounds} onUpdate={setRounds} min={1} />
                <TouchableOpacity style={styles.startBtn} onPress={startTimer}>
                  <Text style={styles.startBtnText}>スタート 🚀</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.timerDisplayContainer}>
                <Text style={styles.phaseText}>{phase === 'WORK' ? '🔥 TRAINING' : phase === 'REST' ? '☕ REST' : '✨ FINISHED'}</Text>
                <Text style={styles.timeLeftText}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</Text>
                <Text style={styles.roundText}>{currentRound} / {rounds} Rounds</Text>
                
                <View style={styles.controlRow}>
                  {phase !== 'FINISH' && (
                    <TouchableOpacity style={[styles.controlBtn, {backgroundColor: isRunning ? COLORS.accentBlue : COLORS.primaryGreen}]} onPress={() => setIsRunning(!isRunning)}>
                      <Text style={styles.controlBtnText}>{isRunning ? "一時停止" : "再開"}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.controlBtn, {backgroundColor: COLORS.grayBackground}]} onPress={confirmResetTimer}>
                    <Text style={[styles.controlBtnText, {color: COLORS.text}]}>リセット</Text>
                  </TouchableOpacity>
                </View>

                {!isRunning && (phase === 'FINISH' || timeLeft < (workMin * 60 + workSec)) && (
                   <TouchableOpacity 
                    style={styles.inlineSaveBtn} 
                    onPress={() => {
                      const totalSecPerRound = (workMin * 60 + workSec) + (restMin * 60 + restSec);
                      const totalMins = Math.ceil((totalSecPerRound * rounds) / 60);
                      validateAndSave(totalMins);
                    }}
                   >
                     <Text style={styles.saveBtnText}>休憩込みの総時間を記録 🏁</Text>
                   </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.timerDisplayContainer}>
              <Text style={styles.timeLeftText}>{Math.floor(swTime / 60).toString().padStart(2, '0')}:{(swTime % 60).toString().padStart(2, '0')}</Text>
              
              <View style={styles.controlRow}>
                <TouchableOpacity style={[styles.controlBtn, {backgroundColor: isRunning ? COLORS.accentBlue : COLORS.primaryGreen}]} onPress={() => setIsRunning(!isRunning)}>
                  <Text style={styles.controlBtnText}>{isRunning ? "一時停止" : "スタート"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.controlBtn, {backgroundColor: COLORS.grayBackground}]} onPress={confirmResetStopwatch}>
                  <Text style={[styles.controlBtnText, {color: COLORS.text}]}>リセット</Text>
                </TouchableOpacity>
              </View>

              {!isRunning && swTime > 0 && (
                <TouchableOpacity style={styles.inlineSaveBtn} onPress={() => validateAndSave(Math.max(1, Math.ceil(swTime / 60)))}>
                  <Text style={styles.saveBtnText}>この記録を保存する 🏁</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <Text style={[styles.label, {marginTop: 25}]}>メモ</Text>
        <TextInput style={styles.memoInput} placeholder="今日の気づきを入力..." placeholderTextColor={COLORS.grayText} multiline value={memo} onChangeText={setMemo} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  saveBtn: { backgroundColor: COLORS.primaryGreen, paddingHorizontal: 25, paddingVertical: 10, borderRadius: 20 },
  saveBtnText: { color: 'white', fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.grayBackground, borderRadius: 15, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: COLORS.white },
  tabText: { color: COLORS.grayText, fontSize: 13 },
  activeTabText: { color: COLORS.text, fontWeight: 'bold' },
  menuInput: { backgroundColor: COLORS.white, borderRadius: 12, padding: 15, fontSize: 18, marginBottom: 15, borderWidth: 1, borderColor: '#DDD', color: COLORS.text },
  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  half: { flex: 1 },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  highlight: { color: COLORS.primaryGreen, fontSize: 18, fontWeight: 'bold' },
  pickerWrapper: { height: 60, backgroundColor: COLORS.white, borderRadius: 15, justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  centerIndicator: { position: 'absolute', left: '50%', marginLeft: -ITEM_WIDTH/2, width: ITEM_WIDTH, height: 45, borderRadius: 10, backgroundColor: '#A4C63915', borderWidth: 2, borderColor: COLORS.primaryGreen, zIndex: 10 },
  numberItem: { width: ITEM_WIDTH, height: '100%', alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 16, color: COLORS.grayText },
  activeNumberText: { fontSize: 22, fontWeight: 'bold', color: COLORS.primaryGreen },
  timeSection: { marginBottom: 20 },
  timePickers: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeSeparator: { fontSize: 20, fontWeight: 'bold', color: COLORS.grayText },
  memoInput: { backgroundColor: COLORS.white, borderRadius: 15, padding: 15, height: 100, textAlignVertical: 'top', color: COLORS.text, borderWidth: 1, borderColor: '#DDD' },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  stepperContainer: { marginBottom: 10 },
  stepperLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { backgroundColor: '#F0F0F0', width: 45, height: 45, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  valueBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', flex: 1, marginHorizontal: 10, height: 45, borderRadius: 12, justifyContent: 'center' },
  valueText: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  unitText: { fontSize: 12, color: COLORS.grayText, marginLeft: 4 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  startBtn: { backgroundColor: COLORS.primaryGreen, padding: 18, borderRadius: 15, marginTop: 20, alignItems: 'center' },
  startBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  timerDisplayContainer: { alignItems: 'center', paddingVertical: 10 },
  phaseText: { fontSize: 22, fontWeight: 'bold', color: COLORS.primaryGreen, marginBottom: 10 },
  timeLeftText: { fontSize: 80, fontWeight: 'bold', color: COLORS.text, fontFamily: 'monospace' },
  roundText: { fontSize: 18, color: COLORS.grayText, marginBottom: 20 },
  controlRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
  controlBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  controlBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  inlineSaveBtn: { backgroundColor: COLORS.primaryGreen, width: '100%', paddingVertical: 15, borderRadius: 12, marginTop: 25, alignItems: 'center' },
});