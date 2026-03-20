import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
// ★ 共通データ（脳）を読み込む
import { workoutData } from './globalState';

const COLORS = {
    primaryGreen: '#A4C639',
    background: '#F5F5F5',
    white: '#FFFFFF',
    text: '#333333',
    grayText: '#757575',
    accent: '#FFD700', // ゴールド
};

// キラキラ演出用のコンポーネント
const Sparkles = ({ color }: { color: string }) => (
    <>
        <Ionicons name="sparkles" size={20} color={color} style={[styles.sparkle, { top: 15, left: 25 }]} />
        <Ionicons name="sparkles" size={20} color={color} style={[styles.sparkle, { top: 60, right: 35 }]} />
        <Ionicons name="sparkles" size={20} color={color} style={[styles.sparkle, { bottom: 30, left: '50%' }]} />
    </>
);

export default function RecordCompleteScreen() {
    const router = useRouter();

    // ★ 最新状態を取得
    const streakDays = workoutData.streakDays;
    const latestId = workoutData.latestAchievementId;
    const newAchievement = workoutData.ACHIEVEMENTS.find(a => a.id === latestId);

    // 次の目標までの計算
    const getNextTarget = (days: number) => {
        if (days < 3) return { next: 3, diff: 3 - days };
        if (days < 7) return { next: 7, diff: 7 - days };
        if (days < 14) return { next: 14, diff: 14 - days };
        if (days < 30) return { next: 30, diff: 30 - days };
        return { next: days + 7, diff: 7 };
    };

    const getMotivation = (days: number) => {
        if (days >= 7) return 'もはやあなたは筋肉のエリート。明日もこの高みで会いましょう！';
        if (days >= 3) return '素晴らしい！リズムができてきましたね。明日の自分も信じて。';
        return 'ナイススタート！この一歩が、未来のあなたを作ります。';
    };

    const target = getNextTarget(streakDays);
    const motivaitonMessage = getMotivation(streakDays);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* 🎉 ヘッダー */}
                <View style={styles.header}>
                    <Text style={styles.headerEmoji}>🎉</Text>
                    <Text style={styles.headerTitle}>お疲れ様でした！</Text>
                    <Text style={styles.headerSubtitle}>今日の努力は、明日の自信になる。</Text>
                </View>

                {/* ★ 実績獲得セクション：称号がある時だけ、レア度に合わせて出し分け */}
                {newAchievement && (
                    <View style={[
                        styles.newAchievementCard, 
                        newAchievement.isRare ? styles.cardRare : styles.cardNormal
                    ]}>
                        <View style={[
                            styles.newBadgeLabel, 
                            { backgroundColor: newAchievement.isRare ? COLORS.accent : COLORS.primaryGreen }
                        ]}>
                            <Text style={[styles.newBadgeLabelText, { color: newAchievement.isRare ? '#000' : '#FFF' }]}>
                                {newAchievement.isRare ? "RARE ACHIEVEMENT!" : "NEW ACHIEVEMENT!"}
                            </Text>
                        </View>

                        <Sparkles color={newAchievement.isRare ? COLORS.accent : COLORS.primaryGreen} />
                        
                        <View style={[
                            styles.newIconCircle, 
                            { backgroundColor: newAchievement.isRare ? COLORS.accent : COLORS.primaryGreen }
                        ]}>
                            <FontAwesome5 name={newAchievement.icon} size={48} color="#FFF" />
                        </View>
                        
                        <Text style={[
                            styles.newName, 
                            { color: newAchievement.isRare ? '#FFF' : '#333' }
                        ]}>
                            {newAchievement.name}
                        </Text>
                        <Text style={[
                            styles.newSub, 
                            { color: newAchievement.isRare ? COLORS.accent : COLORS.primaryGreen }
                        ]}>
                            新しい称号を獲得しました！
                        </Text>
                    </View>
                )}

                {/* 🔥 継続カウンター：メイン */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="flame" size={24} color={COLORS.primaryGreen} />
                        <Text style={styles.cardTitle}>現在の継続日数</Text>
                    </View>
                    <View style={styles.streakContainer}>
                        <Text style={styles.streakNumber}>{streakDays}</Text>
                        <Text style={styles.streakUnit}>日目</Text>
                    </View>
                    <Text style={styles.streakTarget}>次の目標：{target.next}日（あと{target.diff}日！）</Text>
                </View>

                {/* ✨ AIコーチからのエール */}
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
                    onPress={() => {
                        workoutData.clearLatestAchievement();
                        router.replace('/(tabs)/home');
                    }} 
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
    header: { alignItems: 'center', marginTop: 30, marginBottom: 25 },
    headerEmoji: { fontSize: 60, marginBottom: 10 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
    headerSubtitle: { fontSize: 14, color: COLORS.grayText },

    // 実績カード共通
    newAchievementCard: {
        width: '100%',
        borderRadius: 25,
        padding: 30,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        elevation: 10,
    },
    // レア実績（黒×金）
    cardRare: {
        backgroundColor: '#1C1C1E', 
        borderColor: COLORS.accent,
        shadowColor: COLORS.accent,
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    // ノーマル実績（白×緑）
    cardNormal: {
        backgroundColor: '#FFF',
        borderColor: COLORS.primaryGreen,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },

    newBadgeLabel: { position: 'absolute', top: -12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    newBadgeLabelText: { fontWeight: 'bold', fontSize: 11 },
    newIconCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
    newName: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
    newSub: { fontSize: 14, marginTop: 5, fontWeight: '500' },

    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, width: '100%', marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    streakContainer: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 10 },
    streakNumber: { fontSize: 64, fontWeight: 'bold', color: COLORS.primaryGreen, marginRight: 5 },
    streakUnit: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    streakTarget: { fontSize: 14, color: COLORS.grayText, textAlign: 'center' },
    sparkle: { position: 'absolute' },
    messageCard: { flexDirection: 'row', backgroundColor: '#E0F0B0', borderRadius: 15, padding: 15, width: '100%', marginBottom: 30, alignItems: 'center', gap: 15 },
    messageEmoji: { fontSize: 32 },
    messageTextWrapper: { flex: 1 },
    messageTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.primaryGreen, marginBottom: 2 },
    messageText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
    homeButton: { flexDirection: 'row', backgroundColor: COLORS.primaryGreen, width: '100%', paddingVertical: 18, borderRadius: 30, alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 3 },
    homeButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
});