// app/(tabs)/kiroku.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { workoutData } from '../globalState';

const COLORS = {
  primaryGreen: '#A4C639',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayBackground: '#E0E0E0',
  grayText: '#757575',
  border: '#D9D9D9',
};

const ITEM_WIDTH = 45;
const NUMBER_DATA = Array.from({ length: 101 }, (_, i) => i);
const SET_DATA = Array.from({ length: 21 }, (_, i) => i);
const SEC_DATA = Array.from({ length: 60 }, (_, i) => i);

// ここは自分のPCのIPに変えてね
const API_BASE_URL = 'http://192.168.2.191:8000';
const USER_ID = 'test-user-001';

type PickerProps = {
  data: number[];
  currentVal: number;
  onSelect: (value: number) => void;
  pickerRef: React.RefObject<FlatList<number> | null>;
};

const WorkoutPicker = React.memo(function WorkoutPicker({
  data,
  currentVal,
  onSelect,
  pickerRef,
}: PickerProps) {
  const [pickerWidth, setPickerWidth] = useState(0);
  const sidePadding = pickerWidth > 0 ? (pickerWidth - ITEM_WIDTH) / 2 : 0;

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / ITEM_WIDTH);
    if (index >= 0 && index < data.length) {
      onSelect(data[index]);
    }
  };

  return (
    <View
      style={styles.pickerWrapper}
      onLayout={(e) => setPickerWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.centerIndicator} pointerEvents="none" />
      {pickerWidth > 0 && (
        <FlatList
          ref={pickerRef}
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.toString()}
          snapToInterval={ITEM_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          initialScrollIndex={Math.max(0, Math.min(currentVal, data.length - 1))}
          getItemLayout={(_, index) => ({
            length: ITEM_WIDTH,
            offset: ITEM_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: sidePadding }}
          renderItem={({ item }) => (
            <View style={styles.numberItem}>
              <Text
                style={[
                  styles.numberText,
                  currentVal === item && styles.activeNumberText,
                ]}
              >
                {item}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
});

export default function DetailedRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const lastParamsRef = useRef('');
  const countRef = useRef<FlatList<number> | null>(null);
  const setsRef = useRef<FlatList<number> | null>(null);
  const minsRef = useRef<FlatList<number> | null>(null);
  const secsRef = useRef<FlatList<number> | null>(null);

  const getNowStrings = () => {
    const now = new Date();
    const date = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    return { date, time };
  };

  const initialDateTime = getNowStrings();

  const [activeTab, setActiveTab] = useState<'input' | 'stopwatch' | 'timer'>('input');
  const [dateStr, setDateStr] = useState(initialDateTime.date);
  const [timeStr, setTimeStr] = useState(initialDateTime.time);

  const [menu, setMenu] = useState('');
  const [count, setCount] = useState(10);
  const [sets, setSets] = useState(3);
  const [mins, setMins] = useState(0);
  const [secs, setSecs] = useState(30);
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleSetCurrentTime();
  }, []);

  useEffect(() => {
    const paramsKey = JSON.stringify(params);
    if (paramsKey === lastParamsRef.current) return;
    lastParamsRef.current = paramsKey;

    if (typeof params.menu === 'string') {
      setMenu(params.menu);
    }

    const safeSetNumber = (
      value: unknown,
      setter: (n: number) => void,
      ref?: React.RefObject<FlatList<number> | null>
    ) => {
      if (typeof value !== 'string') return;
      const num = Number(value);
      if (Number.isNaN(num)) return;
      setter(num);
      if (ref?.current) {
        setTimeout(() => {
          try {
            ref.current?.scrollToIndex({ index: num, animated: true });
          } catch (error) {
            console.log('scrollToIndex error:', error);
          }
        }, 250);
      }
    };

    safeSetNumber(params.count, setCount, countRef);
    safeSetNumber(params.sets, setSets, setsRef);
    safeSetNumber(params.mins, setMins, minsRef);
    safeSetNumber(params.secs, setSecs, secsRef);
  }, [params]);

  const adjustDate = (days: number) => {
    try {
      const current = new Date(dateStr.replace(/\//g, '-'));
      current.setDate(current.getDate() + days);
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      setDateStr(`${y}/${m}/${d}`);
    } catch (error) {
      console.log('日付パースエラー:', error);
    }
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    setDateStr(
      `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(
        now.getDate()
      ).padStart(2, '0')}`
    );
    setTimeStr(
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    );
  };

  const handleSave = async () => {
    if (!menu.trim()) {
      Alert.alert('メニューが未入力です', 'AIに相談してみますか？', [
        { text: '自分で入力', style: 'cancel' },
        { text: '相談する 🤖', onPress: () => router.push('/(tabs)/ai') },
      ]);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        userId: USER_ID,
        menuName: menu.trim(),
        count: Number(count),
        duration: Number(mins) * 60 + Number(secs),
        memo: memo.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('records save error:', errorText);
        throw new Error('記録保存に失敗しました');
      }

      const result = await response.json();
      console.log('保存完了:', result);

      const totalMins = Number(mins) + (Number(secs) > 0 ? 1 : 0);
      workoutData.addWorkout(totalMins, dateStr);

      router.push('/record_complete');
    } catch (error) {
      console.error(error);
      Alert.alert(
        '通信エラー',
        '記録保存に失敗しました。\nAPI URL、バックエンド起動、同じWi-Fiかを確認してください。'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>記録の入力</Text>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>保存</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabContainer}>
          {['input', 'stopwatch', 'timer'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, activeTab === t && styles.activeTab]}
              onPress={() => setActiveTab(t as 'input' | 'stopwatch' | 'timer')}
            >
              <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>
                {t === 'input'
                  ? '入力'
                  : t === 'stopwatch'
                  ? 'ストップウォッチ'
                  : 'タイマー'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateTimeRow}>
          <View style={styles.dateControlGroup}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustDate(-1)}>
              <Text style={styles.adjustBtnText}>－</Text>
            </TouchableOpacity>

            <View style={styles.dateBadge}>
              <TextInput
                style={styles.dateText}
                value={dateStr}
                onChangeText={setDateStr}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustDate(1)}>
              <Text style={styles.adjustBtnText}>＋</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateBadge}>
            <TextInput
              style={styles.dateText}
              value={timeStr}
              onChangeText={setTimeStr}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <TouchableOpacity style={styles.currentBtn} onPress={handleSetCurrentTime}>
            <Text style={styles.currentBtnText}>現在</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.menuInput}
          placeholder="メニュー名を入力"
          placeholderTextColor={COLORS.grayText}
          value={menu}
          onChangeText={setMenu}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>
              回数: <Text style={styles.highlight}>{count}</Text>
            </Text>
            <WorkoutPicker
              data={NUMBER_DATA}
              currentVal={count}
              onSelect={setCount}
              pickerRef={countRef}
            />
          </View>

          <View style={styles.half}>
            <Text style={styles.label}>
              セット: <Text style={styles.highlight}>{sets}</Text>
            </Text>
            <WorkoutPicker
              data={SET_DATA}
              currentVal={sets}
              onSelect={setSets}
              pickerRef={setsRef}
            />
          </View>
        </View>

        <View style={styles.timeSection}>
          <Text style={styles.label}>
            時間: <Text style={styles.highlight}>{mins}分 {secs}秒</Text>
          </Text>

          <View style={styles.timePickers}>
            <View style={{ flex: 1 }}>
              <WorkoutPicker
                data={NUMBER_DATA}
                currentVal={mins}
                onSelect={setMins}
                pickerRef={minsRef}
              />
            </View>

            <Text style={styles.timeSeparator}>:</Text>

            <View style={{ flex: 1 }}>
              <WorkoutPicker
                data={SEC_DATA}
                currentVal={secs}
                onSelect={setSecs}
                pickerRef={secsRef}
              />
            </View>
          </View>
        </View>

        <TextInput
          style={styles.memoInput}
          placeholder="メモを入力"
          placeholderTextColor={COLORS.grayText}
          multiline
          value={memo}
          onChangeText={setMemo}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 78,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.grayBackground,
    borderRadius: 25,
    padding: 3,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 22,
  },
  activeTab: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    color: COLORS.grayText,
    fontSize: 13,
  },
  activeTabText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateControlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateBadge: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.grayBackground,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.text,
    padding: 0,
    textAlign: 'center',
    minWidth: 78,
  },
  adjustBtn: {
    backgroundColor: COLORS.white,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
  },
  adjustBtnText: {
    color: COLORS.primaryGreen,
    fontSize: 18,
    fontWeight: 'bold',
  },
  currentBtn: {
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
  },
  currentBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuInput: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    fontSize: 18,
    marginBottom: 20,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  half: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  highlight: {
    color: COLORS.primaryGreen,
  },
  timeSection: {
    marginBottom: 20,
  },
  timePickers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: 10,
  },
  pickerWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    height: 70,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  centerIndicator: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: '50%',
    marginLeft: -ITEM_WIDTH / 2,
    width: ITEM_WIDTH,
    borderRadius: 12,
    backgroundColor: '#EEF7D6',
    zIndex: -1,
  },
  numberItem: {
    width: ITEM_WIDTH,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 20,
    color: COLORS.grayText,
  },
  activeNumberText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 24,
  },
  memoInput: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});