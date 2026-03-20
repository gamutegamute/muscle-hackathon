import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLORS = {
  primaryGreen: '#A4C639',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#757575',
  accent: '#FFD700', // ゴールド（称号用）
};

// キラキラエフェクトのモック
const Sparkle = ({ style }: { style: any }) => (
<Ionicons name="sparkles" size={20} color={COLORS.accent} style={[styles.sparkle, style]} />
);
export default function RecordCompleteScreen() {
  const router = useRouter();

  // ハッカソン用のモックデータ
  const streakDays = 10; // 継続10日目
  const achievedTitle = {
    name: 'スクワット初心者',
    icon: 'dumbbell' as any,
  };
  const motivaitonMessage = 'その調子！明日もこの時間、マットの上で会いましょう。';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 🎉 ヘッダー：労いの言葉 */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🎉</Text>
          <Text style={styles.headerTitle}>お疲れ様でした！</Text>
          <Text style={styles.headerSubtitle}>今日の努力は、明日の自信になる。</Text>
        </View>

        {/* 🔥 継続カウンター：何日目か */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flame" size={24} color={COLORS.primaryGreen} />
            <Text style={styles.cardTitle}>現在の継続日数</Text>
          </View>
          <View style={styles.streakContainer}>
            <Text style={styles.streakNumber}>{streakDays}</Text>
            <Text style={styles.streakUnit}>日目</Text>
          </View>
          <Text style={styles.streakTarget}>次の目標：14日（あと4日！）</Text>
        </View>

        {/* 🏆 称号獲得UI：得たことが分かる */}
        {/* ★修正箇所：[styles.card, styles.accentCard] のように配列で指定 */}
        <View style={[styles.card, styles.accentCard]}>
          <Sparkle style={{ top: 10, left: 20 }} />
          <Sparkle style={{ top: 40, right: 30 }} />
          <Sparkle style={{ bottom: 20, left: '50%' }} />

          <View style={styles.cardHeader}>
            <FontAwesome5 name="award" size={24} color={COLORS.accent} />
            {/* ★修正箇所：こちらも配列で指定 */}
            <Text style={[styles.cardTitle, styles.accentCardTitle]}>新しい称号を獲得！</Text>
          </View>
          
          <View style={styles.titleAchievedContainer}>
            <View style={styles.titleIconWrapper}>
              {/* @ts-ignore: icon名の型エラー回避 */}
              <FontAwesome5 name={achievedTitle.icon} size={32} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.achievedTitleName}>{achievedTitle.name}</Text>
              <Text style={styles.achievedTitleCondition}>スクワットの合計記録が100回を突破</Text>
            </View>
          </View>
        </View>

        {/* ✨ 明日も頑張ろうと思えるUI：エール */}
        <View style={styles.messageCard}>
          <Text style={styles.messageEmoji}>💪</Text>
          <View style={styles.messageTextWrapper}>
            <Text style={styles.messageTitle}>AIコーチからのエール</Text>
            <Text style={styles.messageText}>{motivaitonMessage}</Text>
          </View>
        </View>

        {/* ホームへ戻るボタン */}
        <TouchableOpacity 
          style={styles.homeButton} 
          onPress={() => router.replace('/(tabs)/home')} // ホームタブへリプレイス（戻れないように）
        >
          <Text style={styles.homeButtonText}>ホームへ戻る</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  
  // ヘッダー
  header: { alignItems: 'center', marginTop: 30, marginBottom: 30 },
  headerEmoji: { fontSize: 60, marginBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: COLORS.grayText },

  // カード共通
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, width: '100%', marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },

  // 継続カウンター
  streakContainer: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 10 },
  streakNumber: { fontSize: 64, fontWeight: 'bold', color: COLORS.primaryGreen, marginRight: 5 },
  streakUnit: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  streakTarget: { fontSize: 14, color: COLORS.grayText, textAlign: 'center' },

  // 称号獲得（ゴールド）
  accentCard: { borderColor: COLORS.accent, borderWidth: 2, backgroundColor: '#FFFDF0' },
  accentCardTitle: { color: COLORS.accent },
  sparkle: { position: 'absolute' },
  titleAchievedContainer: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  titleIconWrapper: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  achievedTitleName: { fontSize: 20, fontWeight: 'bold', color: COLORS.accent, marginBottom: 3 },
  achievedTitleCondition: { fontSize: 12, color: COLORS.grayText },

  // コーチメッセージ
  messageCard: { flexDirection: 'row', backgroundColor: '#E0F0B0', borderRadius: 15, padding: 15, width: '100%', marginBottom: 30, alignItems: 'center', gap: 15 },
  messageEmoji: { fontSize: 32 },
  messageTextWrapper: { flex: 1 },
  messageTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.primaryGreen, marginBottom: 2 },
  messageText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },

  // ホームボタン
  homeButton: { flexDirection: 'row', backgroundColor: COLORS.primaryGreen, width: '100%', paddingVertical: 18, borderRadius: 30, alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 3 },
  homeButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
});