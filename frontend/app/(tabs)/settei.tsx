import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router'; // ★ useFocusEffectを追加
import React, { useState, useEffect, useCallback } from 'react'; // ★ useCallbackを追加
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
    Switch,
} from 'react-native';
// ★ アプリ全体のデータ（脳みそ）を読み込む
import { workoutData } from '../globalState';

const COLORS = {
    background: '#F5F5F5',
    white: '#FFFFFF',
    text: '#333333',
    grayText: '#8E8E93',
    divider: '#E0E0E0',
    accent: '#FFD700', // ゴールド
};

// ★ テーマカラーの選択肢
const THEME_OPTIONS = [
    { name: 'Android', color: '#A4C639' },
    { name: 'Ocean', color: '#2196F3' },
    { name: 'Fire', color: '#FF5252' },
    { name: 'Grape', color: '#9C27B0' },
    { name: 'Midnight', color: '#37474F' },
];

// 型の定義
interface StatusItemProps {
    label: string;
    value: string;
    unit: string;
    isEditing: boolean;
    onChange: (val: string) => void;
    themeColor: string; 
}

export default function ProfileScreen() {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false); 
    const [showNotifyModal, setShowNotifyModal] = useState(false); 
    const [showHelpModal, setShowHelpModal] = useState(false); 
    const [vibeEnabled, setVibeEnabled] = useState(workoutData.isVibrationEnabled);
    
    // ★ 名前の編集中かどうかを判定するState
    const [isNameEditing, setIsNameEditing] = useState(false); 

    const [theme, setTheme] = useState(workoutData.themeColor);

    useEffect(() => {
        const unsubscribe = workoutData.subscribeColor((newColor) => {
            setTheme(newColor);
        });
        return () => unsubscribe();
    }, []);

    // --- ★ ローカルState：初期値を globalState から取得するように修正 ---
    const [profile, setProfile] = useState({
        name: workoutData.userProfile?.name || '筋肉太郎',
        rank: workoutData.equippedBadge || '🥚 はじまりの一歩', 
        height: workoutData.userProfile?.height || '170',
        weight: workoutData.userProfile?.weight || '65.5',
        bodyFat: workoutData.userProfile?.bodyFat || '18.5',
    });

    // --- ★ 画面を開くたびに最新のプロフィール情報を読み込む ---
    useFocusEffect(
        useCallback(() => {
            setProfile(prev => ({
                ...prev,
                name: workoutData.userProfile?.name || '筋肉太郎',
                height: workoutData.userProfile?.height || '170',
                weight: workoutData.userProfile?.weight || '65.5',
                bodyFat: workoutData.userProfile?.bodyFat || '18.5',
                rank: workoutData.equippedBadge || '🥚 はじまりの一歩',
            }));
        }, [])
    );

    const unlockedBadges = [
        { id: 'default_0', name: 'はじまりの一歩', icon: '🥚' },
        ...workoutData.ACHIEVEMENTS.filter(ach => 
            workoutData.unlockedAchievements.includes(ach.id)
        )
    ];

    const helpGuideData = [
        {
            id: '1',
            icon: 'chatbubbles-outline',
            title: 'AIトレーナー相談',
            desc: 'AIに相談すると、あなたにぴったりのメニューを提案！提案内容はそのまま「記録画面」に自動セットされます。'
        },
        {
            id: '2',
            icon: 'calendar-outline',
            title: '日々の記録と習慣化',
            desc: '筋トレを記録するとカレンダーに色が付きます。累計時間は「分」と「時間」をタップで切り替え可能です。'
        },
        {
            id: '3',
            icon: 'trophy-outline',
            title: '実績と称号システム',
            desc: '特定の目標を達成すると実績が解放されます。獲得した称号はこのマイページからいつでも変更できます。'
        },
        {
            id: '4',
            icon: 'phone-portrait-outline',
            title: '振動フィードバック',
            desc: 'タイマー終了をバイブでお知らせ。トレーニング（WORK）と休憩（REST）で振動パターンが異なります。'
        }
    ];

    const handleSelectBadge = (badgeIcon: string, badgeName: string) => {
        const fullBadgeString = `${badgeIcon} ${badgeName}`;
        setProfile({ ...profile, rank: fullBadgeString });
        workoutData.equippedBadge = fullBadgeString; 
        setShowBadgeModal(false);
    };

    const handleThemeChange = () => {
        const currentIndex = THEME_OPTIONS.findIndex(opt => opt.color === theme);
        const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
        const nextTheme = THEME_OPTIONS[nextIndex];
        
        workoutData.setThemeColor(nextTheme.color);
    };

    const handleLogout = () => {
        workoutData.resetData(); 
        router.replace('/');     
    };

    const toggleVibe = (value: boolean) => {
        setVibeEnabled(value);
        workoutData.setVibrationEnabled(value);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.pageTitle}>マイページ</Text>

                <View style={styles.profileHeader}>
                    <View style={styles.avatarCircle}>
                        <Ionicons name="person" size={50} color={theme} />
                    </View>

                    {/* --- 名前と編集ボタンのコンテナ --- */}
                    <View style={styles.nameContainer}>
                        {isNameEditing ? (
                            <TextInput
                                style={[styles.nameInput, { color: theme, borderBottomColor: theme }]}
                                value={profile.name}
                                onChangeText={(val) => setProfile({ ...profile, name: val })}
                                onBlur={() => {
                                    setIsNameEditing(false);
                                    // ★ 名前編集完了時に globalState にも保存
                                    workoutData.setUserProfile({ name: profile.name });
                                }} 
                                onSubmitEditing={() => {
                                    setIsNameEditing(false);
                                    // ★ エンター押下時にも保存
                                    workoutData.setUserProfile({ name: profile.name });
                                }} 
                                autoFocus
                            />
                        ) : (
                            <>
                                <Text style={styles.userName}>{profile.name}</Text>
                                <TouchableOpacity onPress={() => setIsNameEditing(true)} style={styles.editNameBtn}>
                                    <Ionicons name="pencil" size={18} color={COLORS.grayText} />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                    
                    <TouchableOpacity 
                        style={[styles.rankBadge, { borderColor: COLORS.accent }]} 
                        onPress={() => setShowBadgeModal(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.rankText}>{workoutData.equippedBadge}</Text>
                        <Ionicons name="chevron-down" size={12} color="#D4AF37" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>現在のステータス</Text>
                        <TouchableOpacity onPress={() => {
                            // ★ 「保存」ボタンを押した時に globalState へデータを送る
                            if (isEditing) {
                                workoutData.setUserProfile({
                                    height: profile.height,
                                    weight: profile.weight,
                                    bodyFat: profile.bodyFat,
                                });
                            }
                            setIsEditing(!isEditing);
                        }}>
                            <Text style={[styles.editButtonText, { color: theme }]}>
                                {isEditing ? '保存' : '編集'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statusRow}>
                        <StatusItem label="身長" value={profile.height} unit="cm" isEditing={isEditing} themeColor={theme} onChange={(val) => setProfile({...profile, height: val})} />
                        <StatusItem label="体重" value={profile.weight} unit="kg" isEditing={isEditing} themeColor={theme} onChange={(val) => setProfile({...profile, weight: val})} />
                        <StatusItem label="体脂肪" value={profile.bodyFat} unit="%" isEditing={isEditing} themeColor={theme} onChange={(val) => setProfile({...profile, bodyFat: val})} />
                    </View>
                </View>

                <View style={styles.menuSection}>
                    <MenuLink icon="notifications-outline" label="通知設定" themeColor={theme} onPress={() => setShowNotifyModal(true)} />
                    
                    <TouchableOpacity style={styles.menuItem} onPress={handleThemeChange}>
                        <View style={styles.menuLeft}>
                            <Ionicons name="color-palette-outline" size={22} color={theme} />
                            <Text style={styles.menuLabel}>テーマカラー変更</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme, marginRight: 8, borderWidth: 2, borderColor: '#FFF', elevation: 2 }} />
                            <Ionicons name="chevron-forward" size={20} color={COLORS.grayText} />
                        </View>
                    </TouchableOpacity>

                    <MenuLink icon="help-circle-outline" label="ヘルプ・使い方" themeColor={theme} onPress={() => setShowHelpModal(true)} />
                    
                    <MenuLink icon="log-out-outline" label="ログアウト" color="#FF3B30" onPress={handleLogout} themeColor={theme} />
                </View>
            </ScrollView>

            {/* 実績称号モーダル */}
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
                            renderItem={({ item }) => {
                                const isRareItem = item.id === 'streak_30' || item.id === 'time_500';
                                const isSelected = workoutData.equippedBadge === `${item.icon} ${item.name}`;

                                return (
                                    <TouchableOpacity 
                                        style={styles.badgeItem} 
                                        onPress={() => handleSelectBadge(item.icon, item.name)}
                                    >
                                        <View style={[
                                            styles.badgeIconWrapper, 
                                            { backgroundColor: isRareItem ? COLORS.accent : theme }
                                        ]}>
                                            <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                                        </View>
                                        <Text style={styles.badgeItemName}>{item.name}</Text>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={20} color={theme} />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                <View style={styles.emptyBadgeContainer}>
                                    <Text style={styles.emptyText}>称号がありません</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* 通知設定モーダル */}
            <Modal visible={showNotifyModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { minHeight: 220 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>通知・バイブ設定</Text>
                            <TouchableOpacity onPress={() => setShowNotifyModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>バイブレーション</Text>
                                <Text style={styles.settingSubLabel}>タイマー終了や実績獲得時に振動します</Text>
                            </View>
                            <Switch
                                trackColor={{ false: "#767577", true: theme + '80' }}
                                thumbColor={vibeEnabled ? theme : "#f4f3f4"}
                                onValueChange={toggleVibe}
                                value={vibeEnabled}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ヘルプモーダル */}
            <Modal visible={showHelpModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '85%' }]}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="bulb" size={24} color={theme} style={{ marginRight: 8 }} />
                                <Text style={styles.modalTitle}>使い方ガイド</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            {helpGuideData.map((item) => (
                                <View key={item.id} style={styles.helpListItem}>
                                    <View style={[styles.helpIconContainer, { backgroundColor: theme + '15' }]}>
                                        <Ionicons name={item.icon as any} size={28} color={theme} />
                                    </View>
                                    <View style={styles.helpTextContainer}>
                                        <Text style={styles.helpItemTitle}>{item.title}</Text>
                                        <Text style={styles.helpItemDesc}>{item.desc}</Text>
                                    </View>
                                </View>
                            ))}
                            
                            <TouchableOpacity 
                                style={[styles.guideCloseButton, { backgroundColor: theme }]} 
                                onPress={() => setShowHelpModal(false)}
                            >
                                <Text style={styles.guideCloseButtonText}>わかった！</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

// サブコンポーネント
const StatusItem = ({ label, value, unit, isEditing, onChange, themeColor }: StatusItemProps) => (
    <View style={styles.statusItem}>
        <Text style={styles.statusLabel}>{label}</Text>
        {isEditing ? (
            <TextInput 
                style={[styles.statusInput, { color: themeColor, borderBottomColor: themeColor }]} 
                value={value} 
                onChangeText={onChange} 
                keyboardType="numeric"
            />
        ) : (
            <Text style={styles.statusValue}>{value}<Text style={styles.statusUnit}> {unit}</Text></Text>
        )}
    </View>
);

const MenuLink = ({ icon, label, color = COLORS.text, onPress, themeColor }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuLeft}>
            <Ionicons name={icon} size={22} color={color === '#FF3B30' ? color : themeColor} />
            <Text style={[styles.menuLabel, { color }]}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.grayText} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 },
    pageTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
    profileHeader: { alignItems: 'center', marginBottom: 30 },
    avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    nameContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    userName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
    nameInput: { fontSize: 22, fontWeight: 'bold', borderBottomWidth: 1, padding: 0, textAlign: 'center', minWidth: 120 },
    editNameBtn: { marginLeft: 8, padding: 4 },
    rankBadge: { flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 2, alignItems: 'center' },
    rankText: { fontSize: 14, fontWeight: 'bold', color: '#D4AF37' },
    card: { backgroundColor: COLORS.white, borderRadius: 15, padding: 20, marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    editButtonText: { fontWeight: 'bold', fontSize: 16 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statusItem: { alignItems: 'center', flex: 1 },
    statusLabel: { fontSize: 12, color: COLORS.grayText, marginBottom: 5 },
    statusValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    statusUnit: { fontSize: 12, fontWeight: 'normal' },
    statusInput: { fontSize: 18, fontWeight: 'bold', borderBottomWidth: 1, padding: 0, textAlign: 'center', width: '80%' },
    menuSection: { backgroundColor: COLORS.white, borderRadius: 15, paddingVertical: 5, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.background },
    menuLeft: { flexDirection: 'row', alignItems: 'center' },
    menuLabel: { fontSize: 16, marginLeft: 15, fontWeight: '500', color: '#333' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, minHeight: 400, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    badgeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.background },
    badgeIconWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    badgeItemName: { fontSize: 16, flex: 1, color: COLORS.text, fontWeight: '500' },
    emptyBadgeContainer: { padding: 40, alignItems: 'center' },
    emptyText: { textAlign: 'center', color: COLORS.grayText },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
    settingLabel: { fontSize: 17, fontWeight: '600', color: COLORS.text },
    settingSubLabel: { fontSize: 13, color: COLORS.grayText, marginTop: 4 },
    helpListItem: { flexDirection: 'row', padding: 15, backgroundColor: '#FAFAFA', borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
    helpIconContainer: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    helpTextContainer: { flex: 1 },
    helpItemTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
    helpItemDesc: { fontSize: 13, color: COLORS.grayText, lineHeight: 18 },
    guideCloseButton: { marginTop: 10, paddingVertical: 15, borderRadius: 15, alignItems: 'center', elevation: 2 },
    guideCloseButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});