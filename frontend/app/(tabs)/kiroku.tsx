import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

export default function DetailedRecordScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('input');
  
  // ★ 復活：日付と時間のState
  const [dateStr, setDateStr] = useState('2026/03/20');
  const [timeStr, setTimeStr] = useState('17:15');

  const [menu, setMenu] = useState('');
  const [count, setCount] = useState(10);
  const [sets, setSets] = useState(3);
  const [mins, setMins] = useState(0);
  const [secs, setSecs] = useState(30);
  const [memo, setMemo] = useState('');

  // ★ 復活：現在時刻を取得してセットする関数
  const handleSetCurrentTime = () => {
    const now = new Date();
    setDateStr(`${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`);
    setTimeStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  };

  // ★ ここだけ変更！：メニューが空の時にAIへ誘導するアラート
  const handleSave = () => {
    if (!menu.trim()) {
      Alert.alert(
        'メニューが未入力です',
        '今日のトレーニングは決まっていますか？\n迷っているならAIに相談してみましょう！',
        [
          {
            text: '自分で入力する',
            style: 'cancel',
          },
          {
            text: 'AIに相談する 🤖',
            // AIタブへバビューンと移動！
            onPress: () => router.push('/(tabs)/ai'),
          },
        ]
      );
      return;
    }
    
    // 日付と時間も一緒に保存データとして送れるようになりました
    console.log('保存データ:', { dateStr, timeStr, menu, count, sets, mins, secs, memo });

    router.push('/record_complete');
  };

  const renderPicker = (data: number[], currentVal: number, onSelect: (val: number) => void, initialIndex: number) => {
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
            data={data}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.toString()}
            
            snapToInterval={ITEM_WIDTH}
            snapToOffsets={data.map((_, i) => i * ITEM_WIDTH)} 
            snapToAlignment="start" 
            decelerationRate="normal" 

            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => (
              { length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index }
            )}
            
            onMomentumScrollEnd={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const index = Math.round(x / ITEM_WIDTH);
              if (index >= 0 && index < data.length) {
                onSelect(data[index]);
              }
            }}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const index = Math.round(x / ITEM_WIDTH);
              if (index >= 0 && index < data.length) {
                onSelect(data[index]);
              }
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

        {/* ★ 修正：テキストをTextInputに変更し、手入力＆現在時刻ボタンに対応 */}
        <View style={styles.dateTimeRow}>
          <View style={styles.dateBadge}>
            <TextInput 
              style={styles.dateText} 
              value={dateStr} 
              onChangeText={setDateStr} 
            />
          </View>
          <View style={styles.dateBadge}>
            <TextInput 
              style={styles.dateText} 
              value={timeStr} 
              onChangeText={setTimeStr} 
            />
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
            {renderPicker(NUMBER_DATA, count, setCount, 10)}
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>セット: <Text style={styles.highlight}>{sets}</Text></Text>
            {renderPicker(SET_DATA, sets, setSets, 3)}
          </View>
        </View>

        <View style={styles.timeSection}>
          <Text style={styles.label}>時間: <Text style={styles.highlight}>{mins}分 {secs}秒</Text></Text>
          <View style={styles.timePickers}>
            <View style={{flex:1}}>{renderPicker(NUMBER_DATA, mins, setMins, 0)}</View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={{flex:1}}>{renderPicker(SEC_DATA, secs, setSecs, 30)}</View>
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
  // ★ 修正：TextInput用にpaddingをリセット（Androidで文字が見切れるのを防ぐため）
  dateText: { fontSize: 14, color: COLORS.text, padding: 0 }, 
  currentBtn: { backgroundColor: COLORS.primaryGreen, padding: 10, borderRadius: 12 },
  currentBtnText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  menuInput: { backgroundColor: COLORS.white, borderRadius: 15, padding: 15, fontSize: 18, marginBottom: 20, color: COLORS.text },
  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  half: { flex: 1 },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  highlight: { color: COLORS.primaryGreen, fontSize: 18, fontWeight: 'bold' },
  
  pickerWrapper: { 
    height: 60, 
    backgroundColor: COLORS.white, 
    borderRadius: 15, 
    justifyContent: 'center', 
    overflow: 'hidden',
    position: 'relative'
  },
  centerIndicator: { 
    position: 'absolute', 
    left: '50%', 
    marginLeft: -ITEM_WIDTH/2, 
    width: ITEM_WIDTH, 
    height: 45, 
    borderRadius: 10, 
    backgroundColor: '#A4C63915', 
    borderWidth: 2, 
    borderColor: COLORS.primaryGreen, 
    zIndex: 10 
  },
  
  numberItem: { 
    width: ITEM_WIDTH, 
    height: '100%',
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  numberText: { 
    fontSize: 16, 
    color: COLORS.grayText,
    textAlign: 'center', 
    width: '100%',
  },
  activeNumberText: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: COLORS.primaryGreen 
  },
  
  timeSection: { marginBottom: 20 },
  timePickers: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeSeparator: { fontSize: 20, fontWeight: 'bold', color: COLORS.grayText },
  memoInput: { backgroundColor: COLORS.white, borderRadius: 15, padding: 15, height: 80, textAlignVertical: 'top', color: COLORS.text },
});