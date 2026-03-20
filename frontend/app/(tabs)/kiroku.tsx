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
} from 'react-native';
// ★ 共通データ置き場を読み込む
import { workoutData } from '../globalState';

const COLORS = {
  primaryGreen: '#A4C639',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayBackground: '#E0E0E0',
  grayText: '#757575',
};

const ITEM_WIDTH = 45; 

const NUMBER_DATA = Array.from({ length: 101 }, (_, i) => i);
const SET_DATA = Array.from({ length: 21 }, (_, i) => i);
const SEC_DATA = Array.from({ length: 60 }, (_, i) => i);

// ★ ピッカーコンポーネント（メモ化して動作を軽くし、フリーズを防止）
const WorkoutPicker = React.memo(({ data, currentVal, onSelect, pickerRef }: any) => {
  const [pickerWidth, setPickerWidth] = useState(0);
  const sidePadding = pickerWidth ? (pickerWidth - ITEM_WIDTH) / 2 : 0;

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
          snapToOffsets={data.map((_: any, i: number) => i * ITEM_WIDTH)} 
          snapToAlignment="start" 
          decelerationRate="normal" 
          initialScrollIndex={currentVal}
          getItemLayout={(_, index) => (
            { length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index }
          )}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const index = Math.round(x / ITEM_WIDTH);
            if (index >= 0 && index < data.length) onSelect(data[index]);
          }}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: sidePadding }}
          renderItem={({ item }) => (
            <View style={styles.numberItem}>
              <Text style={[
                styles.numberText, 
                currentVal === item && styles.activeNumberText
              ]}>
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

  // ★ 追加：最後に処理したパラメータを記録する（二重上書き防止）
  const lastParamsRef = useRef("");

  // 4つのピッカー用リモコン
  const countRef = useRef<FlatList>(null);
  const setsRef = useRef<FlatList>(null);
  const minsRef = useRef<FlatList>(null);
  const secsRef = useRef<FlatList>(null);

  const [activeTab, setActiveTab] = useState('input');
  const [dateStr, setDateStr] = useState('2026/03/20');
  const [timeStr, setTimeStr] = useState('17:15');

  const [menu, setMenu] = useState('');
  const [count, setCount] = useState(10);
  const [sets, setSets] = useState(3);
  const [mins, setMins] = useState(0);
  const [secs, setSecs] = useState(30);
  const [memo, setMemo] = useState('');

  // AIからのデータ反映ロジック
  useEffect(() => {
    const paramsKey = JSON.stringify(params);
    if (paramsKey === lastParamsRef.current || !params.menu) return;
    lastParamsRef.current = paramsKey; 

    setMenu(params.menu as string);

    const scrollLists = () => {
      if (params.count) {
        const val = Number(params.count);
        setCount(val);
        setTimeout(() => countRef.current?.scrollToIndex({ index: val, animated: true }), 300);
      }
      if (params.sets) {
        const val = Number(params.sets);
        setSets(val);
        setTimeout(() => setsRef.current?.scrollToIndex({ index: val, animated: true }), 300);
      }
      if (params.mins) {
        const val = Number(params.mins);
        setMins(val);
        setTimeout(() => minsRef.current?.scrollToIndex({ index: val, animated: true }), 300);
      }
      if (params.secs) {
        const val = Number(params.secs);
        setSecs(val);
        setTimeout(() => secsRef.current?.scrollToIndex({ index: val, animated: true }), 300);
      }
    };

    scrollLists();
    handleSetCurrentTime();
  }, [params]);

  const handleSetCurrentTime = () => {
    const now = new Date();
    setDateStr(`${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`);
    setTimeStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  };

  const handleSave = () => {
    if (!menu.trim()) {
      Alert.alert('メニューが未入力です','AIに相談してみますか？',
        [
          { text: '自分で入力', style: 'cancel' },
          { text: '相談する 🤖', onPress: () => router.push('/(tabs)/ai') },
        ]
      );
      return;
    }

    // ★ 共通データへの書き込み処理（ホーム画面の累計時間とカレンダーが更新されます）
    const totalMins = mins + (secs > 0 ? 1 : 0); // 秒があれば1分繰り上げ
    workoutData.addWorkout(totalMins, dateStr);

    console.log('保存完了:', { menu, count, sets, mins, secs });
    router.push('/record_complete');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>記録の入力</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.tabContainer}>
          {['input', 'stopwatch', 'timer'].map((t) => (
            <TouchableOpacity 
              key={t} 
              style={[styles.tab, activeTab === t && styles.activeTab]} 
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>
                {t === 'input' ? '入力' : t === 'stopwatch' ? 'ストップウォッチ' : 'タイマー'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateTimeRow}>
          <View style={styles.dateBadge}>
            <TextInput style={styles.dateText} value={dateStr} onChangeText={setDateStr} />
          </View>
          <View style={styles.dateBadge}>
            <TextInput style={styles.dateText} value={timeStr} onChangeText={setTimeStr} />
          </View>
          <TouchableOpacity style={styles.currentBtn} onPress={handleSetCurrentTime}>
            <Text style={styles.currentBtnText}>現在時刻</Text>
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
            <View style={{flex:1}}>
              <WorkoutPicker data={NUMBER_DATA} currentVal={mins} onSelect={setMins} pickerRef={minsRef} />
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={{flex:1}}>
              <WorkoutPicker data={SEC_DATA} currentVal={secs} onSelect={setSecs} pickerRef={secsRef} />
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
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  saveButton: { backgroundColor: COLORS.primaryGreen, paddingHorizontal: 25, paddingVertical: 10, borderRadius: 20 },
  saveButtonText: { color: COLORS.white, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.grayBackground, borderRadius: 25, padding: 3, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 22 },
  activeTab: { backgroundColor: COLORS.white },
  tabText: { color: COLORS.grayText, fontSize: 13 },
  activeTabText: { color: COLORS.text, fontWeight: 'bold' },
  dateTimeRow: { flexDirection: 'row', gap: 8, marginBottom: 15, alignItems: 'center' },
  dateBadge: { backgroundColor: COLORS.white, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayBackground },
  dateText: { fontSize: 14, color: COLORS.text, padding: 0 }, 
  currentBtn: { backgroundColor: COLORS.primaryGreen, padding: 10, borderRadius: 12 },
  currentBtnText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  menuInput: { backgroundColor: COLORS.white, borderRadius: 15, padding: 15, fontSize: 18, marginBottom: 20, color: COLORS.text },
  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  half: { flex: 1 },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  highlight: { color: COLORS.primaryGreen, fontSize: 18, fontWeight: 'bold' },
  pickerWrapper: { height: 60, backgroundColor: COLORS.white, borderRadius: 15, justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  centerIndicator: { position: 'absolute', left: '50%', marginLeft: -ITEM_WIDTH/2, width: ITEM_WIDTH, height: 45, borderRadius: 10, backgroundColor: '#A4C63915', borderWidth: 2, borderColor: COLORS.primaryGreen, zIndex: 10 },
  numberItem: { width: ITEM_WIDTH, height: '100%', alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 16, color: COLORS.grayText, textAlign: 'center', width: '100%' },
  activeNumberText: { fontSize: 22, fontWeight: 'bold', color: COLORS.primaryGreen },
  timeSection: { marginBottom: 20 },
  timePickers: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeSeparator: { fontSize: 20, fontWeight: 'bold', color: COLORS.grayText },
  memoInput: { backgroundColor: COLORS.white, borderRadius: 15, padding: 15, height: 80, textAlignVertical: 'top', color: COLORS.text },
});