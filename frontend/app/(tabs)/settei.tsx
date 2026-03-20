import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
// ★ アプリ全体のデータ（脳みそ）を読み込む
import { workoutData } from '../globalState';

const COLORS = {
    primaryGreen: '#A4C639',
    background: '#F5F5F5',
    white: '#FFFFFF',
    text: '#333333',
    grayText: '#8E8E93',
    divider: '#E0E0E0',
    accent: '#FFD700', // ゴールド
};

// 型の定義
interface StatusItemProps {
    label: string;
    value: string;
    unit: string;
    isEditing: boolean;
    onChange: (val: string) => void;
}

interface MenuLinkProps {
    icon: any;
    label: string;
    color?: string;
    onPress?: () => void;
}

export default function ProfileScreen() {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false); 

    // --- ローカルState：画面の表示用 ---
    const [profile, setProfile] = useState({
        name: '筋肉太郎',
        // ★ 初期表示も「脳みそ（globalState）」に保存されている称号を読み込む
        rank: workoutData.equippedBadge || '🥚 はじまりの一歩', 
        height: '170',
        weight: '65.5',
        bodyFat: '18.5',
    });

    // ★ 獲得済み実績リストの作成
    const unlockedBadges = [
        // 初期称号は全員持っているので最初からリストに入れる
        { id: 'default_0', name: '🥚 はじまりの一歩', icon: 'egg', isRare: false },
        // globalStateの「獲得済みID」と一致する実績だけを合流させる
        ...workoutData.ACHIEVEMENTS.filter(ach => 
            workoutData.unlockedAchievements.includes(ach.id)
        )
    ];

    // ★ 称号を選択した時の処理（書き込み側）
    const handleSelectBadge = (badgeName: string) => {
        // 1. この画面の表示（State）を更新
        setProfile({ ...profile, rank: badgeName });
        
        // 2. ★アプリ全体の共通データ（脳みそ）にしっかり書き込む
        workoutData.equippedBadge = badgeName; 
        
        // 3. モーダルを閉じる
        setShowBadgeModal(false);
        
        console.log('✅ 称号をグローバルに保存しました:', badgeName);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.pageTitle}>マイページ</Text>

                {/* --- 1. ユーザーヘッダー --- */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarCircle}>
                        <Ionicons name="person" size={50} color={COLORS.grayText} />
                    </View>
                    <Text style={styles.userName}>{profile.name}</Text>
                    
                    {/* 称号バッジ：タップで着せ替えモーダルを開く */}
                    <TouchableOpacity 
                        style={styles.rankBadge} 
                        onPress={() => setShowBadgeModal(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.rankText}>{profile.rank}</Text>
                        <Ionicons name="chevron-down" size={12} color="#D4AF37" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>

                {/* --- 2. 体型ステータスカード --- */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>現在のステータス</Text>
                        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                            <Text style={styles.editButtonText}>{isEditing ? '保存' : '編集'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statusRow}>
                        <StatusItem 
                            label="身長" 
                            value={profile.height} 
                            unit="cm" 
                            isEditing={isEditing} 
                            onChange={(val) => setProfile({...profile, height: val})} 
                        />
                        <StatusItem 
                            label="体重" 
                            value={profile.weight} 
                            unit="kg" 
                            isEditing={isEditing}
                            onChange={(val) => setProfile({...profile, weight: val})} 
                        />
                        <StatusItem 
                            label="体脂肪" 
                            value={profile.bodyFat} 
                            unit="%" 
                            isEditing={isEditing}
                            onChange={(val) => setProfile({...profile, bodyFat: val})} 
                        />
                    </View>
                </View>

                {/* --- 3. 設定メニュー --- */}
                <View style={styles.menuSection}>
                    <MenuLink icon="notifications-outline" label="通知設定" />
                    <MenuLink icon="color-palette-outline" label="テーマカラー" />
                    <MenuLink icon="help-circle-outline" label="ヘルプ・使い方" />
                    <MenuLink 
                        icon="log-out-outline" 
                        label="ログアウト" 
                        color="#FF3B30" 
                        onPress={() => router.replace('/')} 
                    />
                </View>

            </ScrollView>

            {/* --- 実績称号・選択モーダル --- */}
            <Modal visible={showBadgeModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>獲得済みの称号</Text>
                            <TouchableOpacity onPress={() => setShowBadgeModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={unlockedBadges}
                            keyExtractor={(item, index) => item.id + index}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.badgeItem} 
                                    onPress={() => handleSelectBadge(item.name)}
                                >
                                    <View style={[
                                        styles.badgeIconWrapper, 
                                        { backgroundColor: item.isRare ? COLORS.accent : COLORS.primaryGreen }
                                    ]}>
                                        <FontAwesome5 name={item.icon} size={18} color="#FFF" />
                                    </View>
                                    <Text style={styles.badgeItemName}>{item.name}</Text>
                                    {profile.rank === item.name && (
                                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primaryGreen} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyBadgeContainer}>
                                    <Text style={styles.emptyText}>称号がありません</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// --- サブコンポーネント ---

const StatusItem = ({ label, value, unit, isEditing, onChange }: StatusItemProps) => (
    <View style={styles.statusItem}>
        <Text style={styles.statusLabel}>{label}</Text>
        {isEditing ? (
            <TextInput 
                style={styles.statusInput} 
                value={value} 
                onChangeText={onChange} 
                keyboardType="numeric"
            />
        ) : (
            <Text style={styles.statusValue}>{value}<Text style={styles.statusUnit}> {unit}</Text></Text>
        )}
    </View>
);

const MenuLink = ({ icon, label, color = COLORS.text, onPress }: MenuLinkProps) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuLeft}>
            <Ionicons name={icon} size={22} color={color} />
            <Text style={[styles.menuLabel, { color }]}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.grayText} />
    </TouchableOpacity>
);

// --- スタイル定義 ---

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 },
    pageTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
    profileHeader: { alignItems: 'center', marginBottom: 30 },
    avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    userName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
    rankBadge: { flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FFD700', alignItems: 'center' },
    rankText: { fontSize: 14, fontWeight: 'bold', color: '#D4AF37' },
    card: { backgroundColor: COLORS.white, borderRadius: 15, padding: 20, marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    editButtonText: { color: COLORS.primaryGreen, fontWeight: 'bold', fontSize: 16 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statusItem: { alignItems: 'center', flex: 1 },
    statusLabel: { fontSize: 12, color: COLORS.grayText, marginBottom: 5 },
    statusValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    statusUnit: { fontSize: 12, fontWeight: 'normal' },
    statusInput: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryGreen, borderBottomWidth: 1, borderBottomColor: COLORS.primaryGreen, padding: 0, textAlign: 'center', width: '80%' },
    menuSection: { backgroundColor: COLORS.white, borderRadius: 15, paddingVertical: 5, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.background },
    menuLeft: { flexDirection: 'row', alignItems: 'center' },
    menuLabel: { fontSize: 16, marginLeft: 15, fontWeight: '500' },
    
    // モーダル関連
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, minHeight: 400, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    badgeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.background },
    badgeIconWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    badgeItemName: { fontSize: 16, flex: 1, color: COLORS.text, fontWeight: '500' },
    emptyBadgeContainer: { padding: 40, alignItems: 'center' },
    emptyText: { textAlign: 'center', color: COLORS.grayText },
});