import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
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
    background: '#F5F5F5',
    white: '#FFFFFF',
    text: '#333333',
    grayText: '#757575',
    accent: '#FFD700', // ゴールド
};

// ★ 修正：文字に絶対被らない位置にキラキラを配置
const Sparkles = ({ color }: { color: string }) => (
    <>
        {/* 左上 */}
        <Ionicons name="sparkles" size={20} color={color} style={[styles.sparkle, { top: 20, left: 25 }]} />
        {/* 右上 */}
        <Ionicons name="sparkles" size={20} color={color} style={[styles.sparkle, { top: 70, right: 30 }]} />
        {/* アイコンの横 */}
        <Ionicons name="sparkles" size={18} color={color} style={[styles.sparkle, { top: 120, left: 25 }]} />
    </>
);

export default function RecordCompleteScreen() {
    const router = useRouter();

    // ★ 1. テーマカラー管理用のState
    const [theme, setTheme] = useState(workoutData.themeColor);

    // ★ 2. 画面が表示されるたびに最新の色を読み込む
    useFocusEffect(
        useCallback(() => {
            setTheme(workoutData.themeColor);
        }, [])
    );

    // 最新状態を取得
    const streakDays = workoutData.streakDays;
    const latestId = workoutData.latestAchievementId;
    const newAchievement = workoutData.ACHIEVEMENTS.find(a => a.id === latestId);

    // ★ エラー修正：isRare は ID で判定するようにしました
    const isRare = latestId === 'streak_30' || latestId === 'time_100' || latestId === 'time_500';
    const activeColor = isRare ? COLORS.accent : theme;

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
                    <Text style={[styles.headerTitle, { color: theme }]}>お疲れ様でした！</Text>
                    <Text style={styles.headerSubtitle}>今日の努力は、明日の自信になる。</Text>
                </View>

                {/* ★ 実績獲得セクション */}
                {newAchievement && (
                    <View style={[
                        styles.newAchievementCard, 
                        isRare ? styles.cardRare : [styles.cardNormal, { borderColor: theme }]
                    ]}>
                        <View style={[
                            styles.newBadgeLabel, 
                            { backgroundColor: activeColor }
                        ]}>
                            <Text style={[styles.newBadgeLabelText, { color: isRare ? '#000' : '#FFF' }]}>
                                {isRare ? "RARE ACHIEVEMENT!" : "NEW ACHIEVEMENT!"}
                            </Text>
                        </View>

                        <Sparkles color={activeColor} />
                        
                        <View style={[
                            styles.newIconCircle, 
                            { backgroundColor: activeColor }
                        ]}>
                            {/* FontAwesome5 ではなく Text で絵文字表示（エラー回避） */}
                            <Text style={{ fontSize: 48 }}>{newAchievement.icon}</Text>
                        </View>
                        
                        <Text style={[
                            styles.newName, 
                            { color: isRare ? '#FFF' : '#333' }
                        ]}>
                            {newAchievement.name}
                        </Text>
                        <Text style={[
                            styles.newSub, 
                            { color: activeColor }
                        ]}>
                            新しい称号を獲得しました！
                        </Text>
                    </View>
                )}

                {/* 🔥 継続カウンター */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="flame" size={24} color={theme} />
                        <Text style={styles.cardTitle}>現在の継続日数</Text>
                    </View>
                    <View style={styles.streakContainer}>
                        <Text style={[styles.streakNumber, { color: theme }]}>{streakDays}</Text>
                        <Text style={styles.streakUnit}>日目</Text>
                    </View>
                    <Text style={styles.streakTarget}>次の目標：{target.next}日（あと{target.diff}日！）</Text>
                </View>

                {/* ✨ AIコーチからのエール */}
                <View style={[styles.messageCard, { backgroundColor: theme + '20' }]}>
                    <Text style={styles.messageEmoji}>💪</Text>
                    <View style={styles.messageTextWrapper}>
                        <Text style={[styles.messageTitle, { color: theme }]}>AIコーチからのエール</Text>
                        <Text style={styles.messageText}>{motivaitonMessage}</Text>
                    </View>
                </View>

                {/* ホームへ戻るボタン */}
                <TouchableOpacity 
                    style={[styles.homeButton, { backgroundColor: theme }]} 
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
    headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
    headerSubtitle: { fontSize: 14, color: COLORS.grayText },

    newAchievementCard: {
        width: '100%',
        borderRadius: 25,
        padding: 30,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        elevation: 10,
        position: 'relative'
    },
    cardRare: {
        backgroundColor: '#1C1C1E', 
        borderColor: COLORS.accent,
        shadowColor: COLORS.accent,
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    cardNormal: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },

    newBadgeLabel: { position: 'absolute', top: -12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, zIndex: 20 },
    newBadgeLabelText: { fontWeight: 'bold', fontSize: 11 },
    newIconCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
    newName: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', zIndex: 10 },
    newSub: { fontSize: 14, marginTop: 5, fontWeight: '500', zIndex: 10 },

    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, width: '100%', marginBottom: 20, elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    streakContainer: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 10 },
    streakNumber: { fontSize: 64, fontWeight: 'bold', marginRight: 5 },
    streakUnit: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    streakTarget: { fontSize: 14, color: COLORS.grayText, textAlign: 'center' },
    sparkle: { position: 'absolute', zIndex: 1 },
    messageCard: { flexDirection: 'row', borderRadius: 15, padding: 15, width: '100%', marginBottom: 30, alignItems: 'center', gap: 15 },
    messageEmoji: { fontSize: 32 },
    messageTextWrapper: { flex: 1 },
    messageTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
    messageText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
    homeButton: { flexDirection: 'row', width: '100%', paddingVertical: 18, borderRadius: 30, alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 3 },
    homeButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
});