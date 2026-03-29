import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { workoutData } from '../globalState';
import { saveRecordToBackend, syncWorkoutData } from '@/lib/workout-sync';
import { playSwitchSound } from '@/lib/sound';

const COLORS = {
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

// --- FastStepper の修正：型エラーを回避 ---
const FastStepper = ({ label, value, onUpdate, min = 0, max = 99, unit = "" }: any) => {
  const timerRef = useRef<any>(null);

  const startAdjust = (delta: number) => {
    onUpdate((prev: number) => {
      const next = prev + delta;
      return next < min ? min : next > max ? max : next;
    });

    timerRef.current = setTimeout(() => {
      timerRef.current = setInterval(() => {
        onUpdate((prev: number) => {
          const next = prev + delta;
          return next < min ? min : next > max ? max : next;
        });
      }, 100);
    }, 500);
  };

  const stopAdjust = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <View style={styles.stepperContainer}>
      {label !== "" && <Text style={styles.stepperLabel}>{label}</Text>}
      <View style={styles.stepperRow}>
        <TouchableOpacity 
          style={styles.stepBtn} 
          onPressIn={() => startAdjust(-1)} 
          onPressOut={stopAdjust}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.valueBox}>
          <Text style={styles.valueText}>{String(value).padStart(2, '0')}</Text>
          {unit !== "" && <Text style={styles.unitText}>{unit}</Text>}
        </View>
        <TouchableOpacity 
          style={styles.stepBtn} 
          onPressIn={() => startAdjust(1)} 
          onPressOut={stopAdjust}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- WorkoutPicker ---
const WorkoutPicker = React.memo(({ data, currentVal, onSelect, pickerRef, theme }: any) => {
  const [pickerWidth, setPickerWidth] = useState(0);
  const sidePadding = pickerWidth ? (pickerWidth - ITEM_WIDTH) / 2 : 0;

  return (
    <View style={styles.pickerWrapper} onLayout={(e) => setPickerWidth(e.nativeEvent.layout.width)}>
      <View style={[styles.centerIndicator, { borderColor: theme, backgroundColor: theme + '15' }]} pointerEvents="none" />
      {pickerWidth > 0 && (
        <FlatList
          ref={pickerRef}
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.toString()}
          snapToInterval={ITEM_WIDTH}
          snapToAlignment="start"
          initialScrollIndex={currentVal}
          getItemLayout={(_, index) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index })}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
            if (index >= 0 && index < data.length) onSelect(data[index]);
          }}
          contentContainerStyle={{ paddingHorizontal: sidePadding }}
          renderItem={({ item }) => (
            <View style={styles.numberItem}>
              <Text style={[styles.numberText, currentVal === item && [styles.activeNumberText, { color: theme }]]}>{item}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
});
WorkoutPicker.displayName = 'WorkoutPicker';

// --- メイン画面 ---
export default function DetailedRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [theme, setTheme] = useState(workoutData.themeColor);
  const scrollRef = useRef<ScrollView>(null);
  const recordId = typeof params.recordId === 'string' ? params.recordId : '';
  const isEditMode = typeof params.mode === 'string' && params.mode === 'edit';
  const paramMenu = typeof params.menu === 'string' ? params.menu : '';
  const paramCount = typeof params.count === 'string' ? params.count : '';
  const paramSets = typeof params.sets === 'string' ? params.sets : '';
  const paramMins = typeof params.mins === 'string' ? params.mins : '';
  const paramSecs = typeof params.secs === 'string' ? params.secs : '';
  const paramMemo = typeof params.memo === 'string' ? params.memo : '';
  const paramDateStr = typeof params.dateStr === 'string' ? params.dateStr : '';
  const paramTimeStr = typeof params.timeStr === 'string' ? params.timeStr : '';

  useFocusEffect(
    useCallback(() => {
      setTheme(workoutData.themeColor);
    }, [])
  );

  const [activeTab, setActiveTab] = useState('input');
  const getToday = () => {
    const now = new Date();
    return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  };
  const getTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const [menu, setMenu] = useState('');
  const [dateStr, setDateStr] = useState(getToday());
  const [timeStr, setTimeStr] = useState(getTime()); 
  const [memo, setMemo] = useState('');
  const [count, setCount] = useState(10);
  const [sets, setSets] = useState(3);
  const [mins, setMins] = useState(0);
  const [secs, setSecs] = useState(30);
  const [workMin, setWorkMin] = useState(0);
  const [workSec, setWorkSec] = useState(30);
  const [restMin, setRestMin] = useState(0);
  const [restSec, setRestSec] = useState(10);
  const [rounds, setRounds] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<'IDLE' | 'WORK' | 'REST' | 'FINISH'>('IDLE');
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [swTime, setSwTime] = useState(0);

  const countRef = useRef<FlatList>(null);
  const setsRef = useRef<FlatList>(null);
  const minsRef = useRef<FlatList>(null); 
  const secsRef = useRef<FlatList>(null);
  const timerRef = useRef<any>(null);
  const swRef = useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSetCurrentTime = () => {
    setDateStr(getToday());
    setTimeStr(getTime());
  };

  const adjustDate = (days: number) => {
    try {
      const parts = dateStr.match(/\d+/g);
      if (parts && parts.length >= 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const current = new Date(year, month, day);
        if (!isNaN(current.getTime())) {
          current.setDate(current.getDate() + days);
          const y = current.getFullYear();
          const m = String(current.getMonth() + 1).padStart(2, '0');
          const d = String(current.getDate()).padStart(2, '0');
          setDateStr(`${y}/${m}/${d}`);
        }
      }
    } catch { console.log("日付調整失敗"); }
  };

  useEffect(() => {
    if (paramMenu) {
      const c = Number(paramCount) || 10;
      const s = Number(paramSets) || 3;
      const m = Number(paramMins) || 0;
      const sec = Number(paramSecs) || 30;

      setMenu(paramMenu);
      setMemo(paramMemo);
      if (paramDateStr) {
        setDateStr(paramDateStr);
      }
      if (paramTimeStr) {
        setTimeStr(paramTimeStr);
      }
      setCount(c);
      setSets(s);
      setRounds(s);
      setMins(m);
      setSecs(sec);
      setWorkMin(m);
      setWorkSec(sec);

      setTimeout(() => {
        countRef.current?.scrollToIndex({ index: c, animated: true });
        setsRef.current?.scrollToIndex({ index: s, animated: true });
        minsRef.current?.scrollToIndex({ index: m, animated: true });
        secsRef.current?.scrollToIndex({ index: sec, animated: true });
      }, 300);
    }
  }, [paramCount, paramDateStr, paramMemo, paramMenu, paramMins, paramSecs, paramSets, paramTimeStr]);

  const validateAndSave = async (finalMins: number) => {
    if (!menu.trim()) {
      Alert.alert('メニューが未入力です','AIに相談してみますか？',
        [{ text: '自分で入力する', style: 'cancel' }, { text: 'AIに相談する 🤖', onPress: () => router.push('/ai') }]
      );
      return;
    }

    try {
      setIsSaving(true);
      await syncWorkoutData().catch(() => {});
      await saveRecordToBackend({
        recordId: recordId || undefined,
        dateStr,
        timeStr,
        menu: menu.trim(),
        memo,
        count,
        minutes: finalMins || 1,
        interval: restMin * 60 + restSec,
        rounds: activeTab === 'input' ? sets : rounds,
      });
      router.push('/record_complete');
    } catch {
      Alert.alert('保存エラー', '記録の保存に失敗しました。バックエンドの起動や接続先を確認してください。');
    } finally {
      setIsSaving(false);
    }
  };

  const startTimer = () => {
    const total = workMin * 60 + workSec;
    if (total === 0) return;
    setIsRunning(true); setPhase('WORK'); setTimeLeft(total); setCurrentRound(1);
  };

  useEffect(() => {
    if (isRunning && activeTab === 'timer' && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (isRunning && activeTab === 'timer' && timeLeft === 0) {
      playSwitchSound();
      
      if (workoutData.isVibrationEnabled) {
        if (phase === 'WORK') {
          Vibration.vibrate([0, 400, 200, 400]);
        } else if (phase === 'REST') {
          Vibration.vibrate(1000);
        }
      }

      if (phase === 'WORK') {
        if (currentRound < rounds) { setPhase('REST'); setTimeLeft(restMin * 60 + restSec); }
        else { setIsRunning(false); setPhase('FINISH'); }
      } else if (phase === 'REST') {
        setCurrentRound(r => r + 1); setPhase('WORK'); setTimeLeft(workMin * 60 + workSec);
      }
    }
    return () => clearInterval(timerRef.current);
  }, [activeTab, currentRound, isRunning, phase, restMin, restSec, rounds, timeLeft, workMin, workSec]);

  useEffect(() => {
    if (isRunning && activeTab === 'stopwatch') {
      swRef.current = setInterval(() => setSwTime(t => t + 1), 1000);
    } else { clearInterval(swRef.current); }
    return () => clearInterval(swRef.current);
  }, [isRunning, activeTab]);

  return (
    <SafeAreaView style={styles.container}>
      {/* ★ 修正ポイント: behavior を Platform で出し分け、Androidは undefined (OSに任せる) にするのが最も安定します */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>記録</Text>
          {activeTab === 'input' && (
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme, opacity: isSaving ? 0.7 : 1 }]}
              onPress={() => validateAndSave(mins + (secs > 0 ? 1 : 0))}
              disabled={isSaving}
            >
              <Text style={styles.saveBtnText}>{isSaving ? '保存中' : isEditMode ? '更新' : '保存'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          ref={scrollRef} 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'input' && (
            <View style={styles.dateTimeRow}>
              <View style={styles.dateControlGroup}>
                <TouchableOpacity style={[styles.adjustBtn, { borderColor: theme }]} onPress={() => adjustDate(-1)}>
                    <Text style={[styles.adjustBtnText, { color: theme }]}>－</Text>
                </TouchableOpacity>
                <View style={styles.dateBadge}><TextInput style={styles.dateText} value={dateStr} onChangeText={setDateStr} keyboardType="numbers-and-punctuation" /></View>
                <TouchableOpacity style={[styles.adjustBtn, { borderColor: theme }]} onPress={() => adjustDate(1)}>
                    <Text style={[styles.adjustBtnText, { color: theme }]}>＋</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateBadge}><TextInput style={styles.dateText} value={timeStr} onChangeText={setTimeStr} keyboardType="numbers-and-punctuation" /></View>
              <TouchableOpacity style={[styles.currentBtn, { backgroundColor: theme }]} onPress={handleSetCurrentTime}>
                  <Text style={styles.currentBtnText}>現在</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.tabContainer}>
            {['input', 'timer', 'stopwatch'].map((t) => (
              <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.activeTab]} onPress={() => { setActiveTab(t); setIsRunning(false); setPhase('IDLE'); }}>
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
                <View style={styles.half}><Text style={styles.label}>回数: <Text style={[styles.highlight, { color: theme }]}>{count}</Text></Text>
                <WorkoutPicker data={NUMBER_DATA} currentVal={count} onSelect={setCount} pickerRef={countRef} theme={theme} /></View>
                <View style={styles.half}><Text style={styles.label}>セット: <Text style={[styles.highlight, { color: theme }]}>{sets}</Text></Text>
                <WorkoutPicker data={SET_DATA} currentVal={sets} onSelect={setSets} pickerRef={setsRef} theme={theme} /></View>
              </View>
              <View style={styles.timeSection}>
                <Text style={styles.label}>時間: <Text style={[styles.highlight, { color: theme }]}>{mins}分 {secs}秒</Text></Text>
                <View style={styles.timePickers}>
                  <View style={{flex:1}}><WorkoutPicker data={NUMBER_DATA} currentVal={mins} onSelect={setMins} pickerRef={minsRef} theme={theme} /></View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={{flex:1}}><WorkoutPicker data={SEC_DATA} currentVal={secs} onSelect={setSecs} pickerRef={secsRef} theme={theme} /></View>
                </View>
              </View>
            </View>
          ) : activeTab === 'timer' ? (
            <View style={styles.card}>
              {phase === 'IDLE' ? (
                <View>
                  <FastStepper label="① トレーニング時間" value={workMin} onUpdate={setWorkMin} unit="分" />
                  <FastStepper label="" value={workSec} onUpdate={setWorkSec} unit="秒" max={59} />
                  <View style={styles.divider} />
                  <FastStepper label="② インターバル時間" value={restMin} onUpdate={setRestMin} unit="分" />
                  <FastStepper label="" value={restSec} onUpdate={setRestSec} unit="秒" max={59} />
                  <View style={styles.divider} />
                  <FastStepper label="③ 周回数" value={rounds} onUpdate={setRounds} min={1} />
                  <TouchableOpacity style={[styles.startBtn, { backgroundColor: theme }]} onPress={startTimer}><Text style={styles.startBtnText}>スタート 🚀</Text></TouchableOpacity>
                </View>
              ) : (
                <View style={styles.timerDisplayContainer}>
                  <Text style={[styles.phaseText, { color: theme }]}>{phase === 'WORK' ? '🔥 TRAINING' : phase === 'REST' ? '☕ REST' : '✨ FINISHED'}</Text>
                  <Text style={styles.timeLeftText}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</Text>
                  <Text style={styles.roundText}>{currentRound} / {rounds} Rounds</Text>
                  <View style={styles.controlRow}>
                    {phase !== 'FINISH' && <TouchableOpacity style={[styles.controlBtn, {backgroundColor: isRunning ? COLORS.accentBlue : theme}]} onPress={() => setIsRunning(!isRunning)}><Text style={styles.controlBtnText}>{isRunning ? "一時停止" : "再開"}</Text></TouchableOpacity>}
                    <TouchableOpacity style={[styles.controlBtn, {backgroundColor: COLORS.grayBackground}]} onPress={() => { setIsRunning(false); setPhase('IDLE'); }}><Text style={[styles.controlBtnText, {color: COLORS.text}]}>リセット</Text></TouchableOpacity>
                  </View>
                  {!isRunning && (phase === 'FINISH' || timeLeft < (workMin * 60 + workSec)) && (
                     <TouchableOpacity style={[styles.inlineSaveBtn, { backgroundColor: theme }]} onPress={() => validateAndSave(Math.ceil(((workMin * 60 + workSec) + (restMin * 60 + restSec)) * rounds / 60))}>
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
                  <TouchableOpacity style={[styles.controlBtn, {backgroundColor: isRunning ? COLORS.accentBlue : theme}]} onPress={() => setIsRunning(!isRunning)}><Text style={styles.controlBtnText}>{isRunning ? "一時停止" : "計測スタート"}</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.controlBtn, {backgroundColor: COLORS.grayBackground}]} onPress={() => { setIsRunning(false); setSwTime(0); }}><Text style={[styles.controlBtnText, {color: COLORS.text}]}>リセット</Text></TouchableOpacity>
                </View>
                {!isRunning && swTime > 0 && <TouchableOpacity style={[styles.inlineSaveBtn, { backgroundColor: theme }]} onPress={() => validateAndSave(Math.max(1, Math.ceil(swTime / 60)))}><Text style={styles.saveBtnText}>この記録を保存する 🏁</Text></TouchableOpacity>}
              </View>
            </View>
          )}

          <Text style={[styles.label, {marginTop: 25}]}>メモ</Text>
          <TextInput 
            style={styles.memoInput} 
            placeholder="今日の気づきを入力..." 
            placeholderTextColor={COLORS.grayText} 
            multiline 
            value={memo} 
            onChangeText={setMemo}
            onFocus={() => {
              setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
              }, 150);
            }}
          />

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  saveBtn: { paddingHorizontal: 25, paddingVertical: 10, borderRadius: 20 },
  saveBtnText: { color: 'white', fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  dateTimeRow: { flexDirection: 'row', gap: 6, marginBottom: 15, alignItems: 'center', justifyContent: 'space-between' },
  dateControlGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateBadge: { 
    backgroundColor: COLORS.white, 
    paddingVertical: 10, 
    paddingHorizontal: 8, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#DDD',
    minWidth: 100,
    height: 45, 
    justifyContent: 'center'
  },
  dateText: { fontSize: 13, color: COLORS.text, padding: 0, textAlign: 'center', height: 20 }, 
  adjustBtn: { backgroundColor: COLORS.white, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  adjustBtnText: { fontSize: 18, fontWeight: 'bold' },
  currentBtn: { paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12 },
  currentBtnText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.grayBackground, borderRadius: 15, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: COLORS.white },
  tabText: { color: COLORS.grayText, fontSize: 13 },
  activeTabText: { color: COLORS.text, fontWeight: 'bold' },
  menuInput: { backgroundColor: COLORS.white, borderRadius: 12, padding: 15, fontSize: 18, marginBottom: 15, borderWidth: 1, borderColor: '#DDD', color: COLORS.text },
  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  half: { flex: 1 },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  highlight: { fontSize: 18, fontWeight: 'bold' },
  pickerWrapper: { height: 60, backgroundColor: COLORS.white, borderRadius: 15, justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  centerIndicator: { position: 'absolute', left: '50%', marginLeft: -ITEM_WIDTH/2, width: ITEM_WIDTH, height: 45, borderRadius: 10, borderWidth: 2, zIndex: 10 },
  numberItem: { width: ITEM_WIDTH, height: '100%', alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 16, color: COLORS.grayText },
  activeNumberText: { fontSize: 22, fontWeight: 'bold' },
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
  startBtn: { padding: 18, borderRadius: 15, marginTop: 20, alignItems: 'center' },
  startBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  timerDisplayContainer: { alignItems: 'center', paddingVertical: 10 },
  phaseText: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  timeLeftText: { fontSize: 80, fontWeight: 'bold', color: COLORS.text, fontFamily: 'monospace' },
  roundText: { fontSize: 18, color: COLORS.grayText, marginBottom: 20 },
  controlRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
  controlBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  controlBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  inlineSaveBtn: { width: '100%', paddingVertical: 15, borderRadius: 12, marginTop: 25, alignItems: 'center' },
});
