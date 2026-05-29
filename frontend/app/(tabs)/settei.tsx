import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Alert,
  AppState,
  FlatList,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as Clipboard from 'expo-clipboard';

import { workoutData } from '../globalState';
import { logoutFromFirebase } from '@/lib/auth';
import { uploadAvatarImage } from '@/lib/avatar-upload';
import { clearGuestSessionData, clearGuestSessionMarker } from '@/lib/guest-session';
import { saveProfileToBackend, syncWorkoutData } from '@/lib/workout-sync';
import { canRenderAvatarUri } from '@/lib/avatar';

const COLORS = {
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#8E8E93',
  divider: '#E0E0E0',
  accent: '#FFD700',
};

const THEME_COLOR_OPTIONS = [
  '#A4C639',
  '#2196F3',
  '#FF5252',
  '#9C27B0',
  '#37474F',
  '#FFD700',
  '#FF9500',
  '#34C759',
];

interface StatusItemProps {
  label: string;
  value: string;
  unit: string;
  isEditing: boolean;
  onChange: (val: string) => void;
  themeColor: string;
}

type ProfileState = {
  name: string;
  rank: string;
  height: string;
  weight: string;
  bodyFat: string;
  avatar: string | null;
};

type PersistOptions = {
  syncAfterSave?: boolean;
  themeColor?: string;
  equippedBadge?: string;
  isVibrationEnabled?: boolean;
};

function getDefaultName() {
  return workoutData.userProfile?.name || '筋肉太郎';
}

function getDefaultBadge() {
  return workoutData.equippedBadge || '🥚 はじまりの一歩';
}

function getInitialProfileState(): ProfileState {
  return {
    name: getDefaultName(),
    rank: getDefaultBadge(),
    height: workoutData.userProfile?.height ?? '',
    weight: workoutData.userProfile?.weight ?? '',
    bodyFat: workoutData.userProfile?.bodyFat ?? '',
    avatar: workoutData.userProfile?.avatar || null,
  };
}

function isBlankProfileValue(value: string | null | undefined) {
  return !value || !value.trim();
}

export default function ProfileScreen() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [vibeEnabled, setVibeEnabled] = useState(workoutData.isVibrationEnabled);
  const [notificationPermissionRaw, setNotificationPermissionRaw] = useState<Notifications.PermissionStatus | 'undetermined'>('undetermined');
  const [isCheckingNotificationPermission, setIsCheckingNotificationPermission] = useState(false);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [showColorPickerModal, setShowColorPickerModal] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [tempColor, setTempColor] = useState(workoutData.themeColor);
  const [theme, setTheme] = useState(workoutData.themeColor);
  const [devMode, setDevMode] = useState(workoutData.isDevMode);
  const [profile, setProfile] = useState<ProfileState>(getInitialProfileState());
  const isPersistingNameRef = useRef(false);
  const profileRef = useRef<ProfileState>(getInitialProfileState());
  const lastNotificationStatusRef = useRef<Notifications.PermissionStatus | 'undetermined'>('undetermined');

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    const unsubscribe = workoutData.subscribeColor((newColor: string) => {
      setTheme(newColor);
    });
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setTheme(workoutData.themeColor);
      setVibeEnabled(workoutData.isVibrationEnabled);
      setProfile(getInitialProfileState());
      setDevMode(workoutData.isDevMode);
    }, []),
  );

  React.useEffect(() => {
    const unsubscribe = workoutData.subscribeData(() => {
      setDevMode(workoutData.isDevMode);
    });
    return () => unsubscribe();
  }, []);

  const helpGuideData = [
    {
      id: '1',
      icon: 'chatbubbles-outline',
      title: 'AIトレーナーに相談',
      desc: 'AI に相談すると、あなたに合ったメニュー提案や運動時間の目安を確認できます。',
    },
    {
      id: '2',
      icon: 'calendar-outline',
      title: '日々の記録と振り返り',
      desc: 'トレーニングを記録するとカレンダーやホームに反映され、毎日の積み重ねを振り返れます。',
    },
    {
      id: '3',
      icon: 'trophy-outline',
      title: '実績とバッジシステム',
      desc: '達成状況に応じてバッジを獲得できます。継続のモチベーション作りに役立ちます。',
    },
    {
      id: '4',
      icon: 'pulse-outline',
      title: 'タイマーとバイブ',
      desc: 'タイマーの切り替えに合わせて、トレーニングと休憩を分かりやすくサポートします。',
    },
  ];

  const achievementItems = [
    { id: 'default_0', icon: '🥚', name: 'はじまりの一歩', detail: 'アプリを始めた最初の実績です。', conditionText: '条件: アプリを使い始める' },
    { id: 'streak_3', icon: '🔥', name: '3日連続の挑戦者', detail: '3日連続でトレーニングを続けた証です。', conditionText: '条件: 3日連続で記録する' },
    { id: 'streak_7', icon: '🏅', name: '継続のルーキー', detail: '1週間しっかり積み上げたときに取れる実績です。', conditionText: '条件: 7日連続で記録する' },
    { id: 'streak_14', icon: '💪', name: '2週間の努力家', detail: '2週間続けられたときに解放される実績です。', conditionText: '条件: 14日連続で記録する' },
    { id: 'streak_30', icon: '👑', name: '筋肉の王者', detail: '1か月継続した人だけが取れる実績です。', conditionText: '条件: 30日連続で記録する' },
    { id: 'time_100', icon: '⏱️', name: '努力の積み上げ', detail: 'コツコツ積み上げて合計100分を超えた証です。', conditionText: '条件: 合計100分以上トレーニングする' },
    { id: 'time_500', icon: '🏆', name: '筋肉の勲章', detail: 'かなり頑張った人向けの大きな実績です。', conditionText: '条件: 合計500分以上トレーニングする' },
    { id: 'ai_1', icon: '🤖', name: 'AIとの出会い', detail: 'AI相談を初めて使ったときに取れる実績です。', conditionText: '条件: AI相談を1回使う' },
    { id: 'ai_5', icon: '🧠', name: 'AIマニア', detail: 'AI相談をたくさん活用した人向けの実績です。', conditionText: '条件: AI相談を5回使う' },
    { id: 'rank_champion_1', icon: '🥇', name: '週間王者の第一歩', detail: '1週間の最終ランキングで1位を1回獲得する', conditionText: '条件: 1週間の最終ランキングで1位になる' },
    { id: 'rank_champion_3', icon: '🏆', name: '常勝トップランナー', detail: '1週間の最終ランキングで1位を3回獲得する', conditionText: '条件: 1週間の最終ランキングで1位を3回獲得する' },
    { id: 'rank_champion_5', icon: '👑', name: '絶対的覇者', detail: '1週間の最終ランキングで1位を5回獲得する', conditionText: '条件: 1週間の最終ランキングで1位を5回獲得する' },
    { id: 'rank_consecutive_2', icon: '🎖️', name: '2連覇達成！', detail: '2週間連続で最終ランキング1位を獲得する', conditionText: '条件: 2週間連続で最終ランキング1位になる' },
    { id: 'rank_consecutive_3', icon: '🏅', name: '伝説の3連覇！！', detail: '3週間連続で最終ランキング1位を獲得する', conditionText: '条件: 3週間連続で最終ランキング1位になる' },
  ];


  const unlockedBadges = [
    { id: 'default_0', name: 'はじまりの一歩', icon: '🥚' },
    ...workoutData.ACHIEVEMENTS.filter((ach: (typeof workoutData.ACHIEVEMENTS)[number]) => workoutData.unlockedAchievements.includes(ach.id)),
  ];

  const buildPersistedProfilePayload = (overrides?: Partial<ProfileState>, options?: PersistOptions) => {
    const nextProfile = { ...profile, ...overrides };
    const nextName = nextProfile.name.trim() || workoutData.userProfile?.name || 'あなた';

    return {
      name: nextName,
      age: workoutData.userProfile.age,
      height: nextProfile.height,
      weight: nextProfile.weight,
      bodyFat: nextProfile.bodyFat,
      avatar: nextProfile.avatar,
      equippedBadge: options?.equippedBadge ?? nextProfile.rank ?? workoutData.equippedBadge ?? '🥚 はじまりの一歩',
      themeColor: options?.themeColor ?? workoutData.themeColor,
      isVibrationEnabled: options?.isVibrationEnabled ?? workoutData.isVibrationEnabled,
    };
  };

  const persistProfileState = async (
    overrides?: Partial<ProfileState>,
    options?: PersistOptions,
  ) => {
    const payload = buildPersistedProfilePayload(overrides, options);
    const previousProfile = { ...workoutData.userProfile };
    const previousBadge = workoutData.equippedBadge;
    const previousTheme = workoutData.themeColor;
    const previousVibration = workoutData.isVibrationEnabled;

    workoutData.setThemeColor(payload.themeColor);
    workoutData.setVibrationEnabled(payload.isVibrationEnabled);
    setProfile({
      name: payload.name,
      rank: payload.equippedBadge,
      height: payload.height,
      weight: payload.weight,
      bodyFat: payload.bodyFat,
      avatar: payload.avatar ?? null,
    });
    workoutData.equippedBadge = payload.equippedBadge;
    setTheme(payload.themeColor);
    setVibeEnabled(payload.isVibrationEnabled);
    workoutData.setUserProfile({
      name: payload.name,
      height: payload.height,
      weight: payload.weight,
      bodyFat: payload.bodyFat,
      avatar: payload.avatar ?? null,
    });

    try {
      await saveProfileToBackend({
        name: payload.name,
        age: payload.age,
        height: payload.height,
        weight: payload.weight,
        bodyFat: payload.bodyFat,
        avatar: payload.avatar,
        themeColor: payload.themeColor,
        equippedBadge: payload.equippedBadge,
        isVibrationEnabled: payload.isVibrationEnabled,
      });

      if (options?.syncAfterSave !== false) {
        await syncWorkoutData();
      }
    } catch {
      workoutData.equippedBadge = previousBadge;
      workoutData.setThemeColor(previousTheme);
      workoutData.setVibrationEnabled(previousVibration);
      workoutData.setUserProfile(previousProfile);
      setTheme(previousTheme);
      setVibeEnabled(previousVibration);
      setProfile({
        name: previousProfile.name || '筋肉太郎',
        rank: previousBadge || '🥚 はじまりの一歩',
        height: previousProfile.height ?? '',
        weight: previousProfile.weight ?? '',
        bodyFat: previousProfile.bodyFat ?? '',
        avatar: previousProfile.avatar || null,
      });
    }
  };

  const syncNotificationPermissionState = useCallback(async (options?: { syncIfChanged?: boolean }) => {
    try {
      setIsCheckingNotificationPermission(true);
      const settings = await Notifications.getPermissionsAsync();
      const nextStatus = settings.status;
      const previousStatus = lastNotificationStatusRef.current;

      setNotificationPermissionRaw(nextStatus);
      lastNotificationStatusRef.current = nextStatus;

      if (options?.syncIfChanged && previousStatus !== nextStatus) {
        const currentProfile = profileRef.current;
        const nextName = currentProfile.name.trim() || workoutData.userProfile?.name || 'あなた';

        await saveProfileToBackend({
          name: nextName,
          age: workoutData.userProfile.age,
          height: currentProfile.height,
          weight: currentProfile.weight,
          bodyFat: currentProfile.bodyFat,
          avatar: currentProfile.avatar,
          themeColor: workoutData.themeColor,
          equippedBadge: currentProfile.rank,
          isVibrationEnabled: workoutData.isVibrationEnabled,
        });
      }
    } catch {
      setNotificationPermissionRaw('undetermined');
    } finally {
      setIsCheckingNotificationPermission(false);
    }
  }, []);

  useEffect(() => {
    if (!showNotifyModal) return;

    void syncNotificationPermissionState();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncNotificationPermissionState({ syncIfChanged: true });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [showNotifyModal, syncNotificationPermissionState]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const imageUri = asset.uri;

      if (workoutData.sessionMode !== 'registered') {
        setProfile((prev) => ({ ...prev, avatar: imageUri }));
        void persistProfileState({ avatar: imageUri }, { syncAfterSave: false });
        return;
      }

      setIsUploadingAvatar(true);
      setProfile((prev) => ({ ...prev, avatar: imageUri }));

      try {
        const avatarUrl = await uploadAvatarImage(imageUri, asset.mimeType);
        await persistProfileState({ avatar: avatarUrl }, { syncAfterSave: false });
      } catch (error) {
        console.warn('Failed to upload avatar:', error);
        setProfile((prev) => ({ ...prev, avatar: workoutData.userProfile.avatar || null }));
        Alert.alert('画像アップロードに失敗しました', '時間をおいてもう一度お試しください。');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleSelectBadge = (badgeIcon: string, badgeName: string) => {
    const fullBadgeString = `${badgeIcon} ${badgeName}`;
    setProfile((prev) => ({ ...prev, rank: fullBadgeString }));
    setShowBadgeModal(false);
    void persistProfileState({ rank: fullBadgeString }, { syncAfterSave: false, equippedBadge: fullBadgeString });
  };

  const openColorPicker = () => {
    setTempColor(theme);
    setShowColorPickerModal(true);
  };

  const confirmColorPicker = () => {
    void persistProfileState(undefined, { syncAfterSave: false, themeColor: tempColor });
    setShowColorPickerModal(false);
  };

  const handleCopyFriendId = async () => {
    const friendId = workoutData.userProfile.friendId;
    if (!friendId) {
      return;
    }

    await Clipboard.setStringAsync(friendId);
    Alert.alert('コピーしました', `ID: ${friendId}`);
  };

  const handleLogout = async () => {
    try {
      if (workoutData.isGuestUser()) {
        await clearGuestSessionData();
      } else {
        await clearGuestSessionMarker();
        await logoutFromFirebase();
      }

      workoutData.resetData({ sessionMode: 'logged_out' });
      router.replace('/');
    } catch {
      Alert.alert('ログアウトエラー', 'ログアウトに失敗しました。もう一度お試しください。');
    }
  };

  const toggleVibe = (value: boolean) => {
    void persistProfileState(undefined, { syncAfterSave: false, isVibrationEnabled: value });
  };

  const requestNotificationPermission = async () => {
    try {
      setIsCheckingNotificationPermission(true);
      const settings = await Notifications.requestPermissionsAsync();
      const nextStatus = settings.status;
      const previousStatus = lastNotificationStatusRef.current;

      setNotificationPermissionRaw(nextStatus);
      lastNotificationStatusRef.current = nextStatus;

      if (previousStatus !== nextStatus) {
        const currentProfile = profileRef.current;
        const nextName = currentProfile.name.trim() || workoutData.userProfile?.name || 'あなた';

        await saveProfileToBackend({
          name: nextName,
          age: workoutData.userProfile.age,
          height: currentProfile.height,
          weight: currentProfile.weight,
          bodyFat: currentProfile.bodyFat,
          avatar: currentProfile.avatar,
          themeColor: workoutData.themeColor,
          equippedBadge: currentProfile.rank,
          isVibrationEnabled: workoutData.isVibrationEnabled,
        });
      }
    } catch {
      setNotificationPermissionRaw('undetermined');
    } finally {
      setIsCheckingNotificationPermission(false);
    }
  };

  const openNotificationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {}
  };

  const handleNotificationPermissionSwitch = async (value: boolean) => {
    if (notificationPermissionRaw === 'undetermined' && value) {
      await requestNotificationPermission();
      return;
    }
    await openNotificationSettings();
  };

  const handlePersistProfileName = async () => {
    if (isPersistingNameRef.current) {
      return;
    }

    isPersistingNameRef.current = true;
    setIsNameEditing(false);

    try {
      await persistProfileState();
    } finally {
      isPersistingNameRef.current = false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>マイページ</Text>

        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarCircle} onPress={pickImage} activeOpacity={0.8} disabled={isUploadingAvatar}>
            {canRenderAvatarUri(profile.avatar) ? (
              <Image source={{ uri: profile.avatar!.trim() }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={50} color={theme} />
            )}
            <View style={[styles.cameraBadge, { backgroundColor: theme }]}>
              <Ionicons name="camera" size={14} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          {isUploadingAvatar ? <Text style={styles.avatarUploadText}>画像を保存中...</Text> : null}

          <View style={styles.nameContainer}>
            {isNameEditing ? (
              <>
                <TextInput
                  style={[styles.nameInput, { color: theme, borderBottomColor: theme }]}
                  value={profile.name}
                  onChangeText={(val) => setProfile((prev) => ({ ...prev, name: val }))}
                  onBlur={() => {
                    void handlePersistProfileName();
                  }}
                  onEndEditing={() => {
                    void handlePersistProfileName();
                  }}
                  onSubmitEditing={() => {
                    void handlePersistProfileName();
                  }}
                  returnKeyType="done"
                  blurOnSubmit
                  autoFocus
                />
                <TouchableOpacity onPress={() => void handlePersistProfileName()} style={styles.editNameBtn}>
                  <Ionicons name="checkmark" size={20} color={theme} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.userName}>{profile.name}</Text>
                <TouchableOpacity onPress={() => setIsNameEditing(true)} style={styles.editNameBtn}>
                  <Ionicons name="pencil" size={18} color={COLORS.grayText} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {workoutData.sessionMode === 'registered' && workoutData.userProfile.friendId ? (
            <View style={styles.friendIdBadge}>
              <Ionicons name="id-card-outline" size={14} color={theme} />
              <Text style={styles.friendIdText}>ID: {workoutData.userProfile.friendId}</Text>
              <TouchableOpacity style={[styles.copyIdButton, { borderColor: theme }]} onPress={handleCopyFriendId}>
                <Ionicons name="copy-outline" size={14} color={theme} />
                <Text style={[styles.copyIdText, { color: theme }]}>コピー</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.rankBadge, { borderColor: COLORS.accent }]}
            onPress={() => setShowBadgeModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.rankText}>{profile.rank}</Text>
            <Ionicons name="chevron-down" size={12} color="#D4AF37" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>現在のステータス</Text>
            <TouchableOpacity
              onPress={() => {
                const nextEditing = !isEditing;
                if (isEditing) {
                  void persistProfileState();
                }
                setIsEditing(nextEditing);
              }}
            >
              <Text style={[styles.editButtonText, { color: theme }]}>{isEditing ? '保存' : '編集'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusRow}>
            <StatusItem label="身長" value={profile.height} unit="cm" isEditing={isEditing} themeColor={theme} onChange={(val) => setProfile((prev) => ({ ...prev, height: val }))} />
            <StatusItem label="体重" value={profile.weight} unit="kg" isEditing={isEditing} themeColor={theme} onChange={(val) => setProfile((prev) => ({ ...prev, weight: val }))} />
            <StatusItem label="体脂肪" value={profile.bodyFat} unit="%" isEditing={isEditing} themeColor={theme} onChange={(val) => setProfile((prev) => ({ ...prev, bodyFat: val }))} />
          </View>
        </View>

        <View style={styles.menuSection}>
          <MenuLink icon="notifications-outline" label="通知設定" themeColor={theme} onPress={() => setShowNotifyModal(true)} />

          <TouchableOpacity style={styles.menuItem} onPress={openColorPicker}>
            <View style={styles.menuLeft}>
              <Ionicons name="color-palette-outline" size={22} color={theme} />
              <Text style={styles.menuLabel}>テーマカラー変更</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme, marginRight: 8, borderWidth: 2, borderColor: '#FFF', elevation: 2 }} />
              <Ionicons name="chevron-forward" size={20} color={COLORS.grayText} />
            </View>
          </TouchableOpacity>

          <MenuLink icon="trophy-outline" label="実績一覧" themeColor={theme} onPress={() => setShowAchievementsModal(true)} />
          <View style={{ borderTopWidth: 1, borderTopColor: COLORS.background }} />
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="code-slash-outline" size={22} color={theme} />
              <View style={{ marginLeft: 15, flex: 1 }}>
                <Text style={[styles.menuLabel, { color: COLORS.text }]}>デベロッパーモード</Text>
                <Text style={[styles.settingSubLabel, { marginTop: 4 }]}>ON にするとすべての実績が一時的に開放されます（ローカルのみ）</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: `${theme}80` }}
              thumbColor={devMode ? theme : '#f4f3f4'}
              onValueChange={(value) => {
                workoutData.setDevMode(value);
                setDevMode(value);
              }}
              value={devMode}
            />
          </View>
          <MenuLink icon="help-circle-outline" label="ヘルプ・使い方" themeColor={theme} onPress={() => setShowHelpModal(true)} />
          <MenuLink icon="log-out-outline" label="ログアウト" color="#FF3B30" onPress={handleLogout} themeColor={theme} />
        </View>
      </ScrollView>

      <Modal visible={showBadgeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>獲得済みのバッジ</Text>
              <TouchableOpacity onPress={() => setShowBadgeModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={unlockedBadges}
              keyExtractor={(item, index) => item.id + index}
              renderItem={({ item }) => {
                const isRareItem = item.id === 'streak_30' || item.id === 'time_500';
                const isSelected = profile.rank === `${item.icon} ${item.name}`;

                return (
                  <TouchableOpacity style={styles.badgeItem} onPress={() => handleSelectBadge(item.icon, item.name)}>
                    <View style={[styles.badgeIconWrapper, { backgroundColor: isRareItem ? COLORS.accent : theme }]}>
                      <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                    </View>
                    <Text style={styles.badgeItemName}>{item.name}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyBadgeContainer}>
                  <Text style={styles.emptyText}>まだバッジがありません</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

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
                <Text style={styles.settingSubLabel}>タイマーや実績表示のタイミングで振動します</Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: `${theme}80` }}
                thumbColor={vibeEnabled ? theme : '#f4f3f4'}
                onValueChange={toggleVibe}
                value={vibeEnabled}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>通知の許可</Text>
                <Text style={styles.settingSubLabel}>
                  {isCheckingNotificationPermission
                    ? '許可状態を確認しています'
                    : notificationPermissionRaw === 'granted'
                      ? 'ON。スイッチ操作でiPhoneの設定画面を開けます'
                      : 'OFF。スイッチ操作で通知許可を確認できます'}
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: `${theme}80` }}
                thumbColor={notificationPermissionRaw === 'granted' ? theme : '#f4f3f4'}
                onValueChange={(value) => {
                  void handleNotificationPermissionSwitch(value);
                }}
                value={notificationPermissionRaw === 'granted'}
              />
            </View>
          </View>
        </View>
      </Modal>

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
                  <View style={[styles.helpIconContainer, { backgroundColor: `${theme}15` }]}>
                    <Ionicons name={item.icon as any} size={28} color={theme} />
                  </View>
                  <View style={styles.helpTextContainer}>
                    <Text style={styles.helpItemTitle}>{item.title}</Text>
                    <Text style={styles.helpItemDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={[styles.guideCloseButton, { backgroundColor: theme }]} onPress={() => setShowHelpModal(false)}>
                <Text style={styles.guideCloseButtonText}>わかった</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAchievementsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="trophy-outline" size={24} color={theme} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>実績一覧</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAchievementsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {(() => {
                const achievements = achievementItems.map((achievement) => ({
                  ...achievement,
                  unlocked: achievement.id === 'default_0' || workoutData.unlockedAchievements.includes(achievement.id),
                }));
                const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

                return (
                  <>
                    <View style={styles.summaryCard}>
                      <Ionicons name="trophy-outline" size={22} color={theme} />
                      <Text style={styles.summaryText}>
                        取得済み <Text style={[styles.summaryHighlight, { color: theme }]}>{unlockedCount}</Text> / {achievements.length}
                      </Text>
                    </View>

                    {achievements.map((achievement) => (
                      <TouchableOpacity
                        key={achievement.id}
                        style={styles.achievementItem}
                        activeOpacity={achievement.unlocked ? 0.8 : 1}
                        onPress={() => {
                          if (achievement.unlocked) {
                            Alert.alert(achievement.name, `${achievement.detail}\n\n${achievement.conditionText}`);
                          }
                        }}
                        disabled={!achievement.unlocked}
                      >
                        <View
                          style={[
                            styles.achievementIconCircle,
                            { backgroundColor: achievement.unlocked ? `${theme}15` : '#F1F1F1' },
                          ]}
                        >
                          <Text style={styles.achievementIconText}>{achievement.unlocked ? achievement.icon : '???'}</Text>
                        </View>

                        <View style={styles.achievementBody}>
                          <Text style={[styles.achievementName, !achievement.unlocked && { color: COLORS.grayText }]}>
                            {achievement.unlocked ? achievement.name : '？？？'}
                          </Text>
                          <Text style={styles.achievementMeta}>
                            {achievement.unlocked ? 'タップで詳細を表示' : '未取得'}
                          </Text>
                        </View>

                        <View style={styles.achievementRightArea}>
                          <View
                            style={[
                              styles.achievementStatusBadge,
                              { backgroundColor: achievement.unlocked ? theme : '#D8D8D8' },
                            ]}
                          >
                            <Text style={styles.achievementStatusBadgeText}>{achievement.unlocked ? 'GET' : 'LOCK'}</Text>
                          </View>
                          {achievement.unlocked ? (
                            <Ionicons name="chevron-forward" size={18} color={theme} style={styles.achievementChevron} />
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={showColorPickerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 20 }]}>
            <Text style={[styles.modalTitle, { marginBottom: 20 }]}>テーマカラーを選択</Text>

            <View style={styles.colorGrid}>
              {THEME_COLOR_OPTIONS.map((color) => {
                const isSelected = tempColor.toLowerCase() === color.toLowerCase();

                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorSwatchButton,
                      { borderColor: isSelected ? color : COLORS.divider },
                    ]}
                    onPress={() => setTempColor(color)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: color }]}>
                      {isSelected ? <Ionicons name="checkmark" size={24} color={COLORS.white} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 16, width: '100%' }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 24, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' }}
                onPress={() => setShowColorPickerModal(false)}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#555555' }}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 24, backgroundColor: tempColor, alignItems: 'center', justifyContent: 'center' }}
                onPress={confirmColorPicker}
              >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' }}>決定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
      <Text style={styles.statusValue}>
        {isBlankProfileValue(value) ? (
          <Text style={styles.statusPlaceholder}>未設定</Text>
        ) : (
          <>
            {value}
            <Text style={styles.statusUnit}> {unit}</Text>
          </>
        )}
      </Text>
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
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarUploadText: { fontSize: 12, color: COLORS.grayText, marginBottom: 8 },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  nameContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  friendIdBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginBottom: 8 },
  friendIdText: { color: COLORS.grayText, fontSize: 12, fontWeight: '600' },
  copyIdButton: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, marginLeft: 4 },
  copyIdText: { fontSize: 11, fontWeight: 'bold' },
  userName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  nameInput: { fontSize: 22, fontWeight: 'bold', borderBottomWidth: 1, padding: 0, textAlign: 'center', minWidth: 120 },
  editNameBtn: { marginLeft: 8, padding: 4 },
  rankBadge: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
  },
  rankText: { fontSize: 14, fontWeight: 'bold', color: '#D4AF37' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  editButtonText: { fontWeight: 'bold', fontSize: 16 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem: { alignItems: 'center', flex: 1 },
  statusLabel: { fontSize: 12, color: COLORS.grayText, marginBottom: 5 },
  statusValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  statusPlaceholder: { fontSize: 16, fontWeight: 'normal', color: COLORS.grayText },
  statusUnit: { fontSize: 12, fontWeight: 'normal' },
  statusInput: { fontSize: 18, fontWeight: 'bold', borderBottomWidth: 1, padding: 0, textAlign: 'center', width: '80%' },
  menuSection: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    paddingVertical: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuLabel: { fontSize: 16, marginLeft: 15, fontWeight: '500', color: '#333' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 20, padding: 25, minHeight: 300, maxHeight: '80%', maxWidth: 480, width: '90%', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  colorSwatchButton: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  colorSwatch: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
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
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 16 },
  summaryText: { fontSize: 14, color: COLORS.text },
  summaryHighlight: { fontSize: 18, fontWeight: 'bold' },
  achievementItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#EEEEEE', gap: 12 },
  achievementIconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  achievementIconText: { fontSize: 22, fontWeight: 'bold' },
  achievementBody: { flex: 1 },
  achievementName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  achievementMeta: { fontSize: 12, color: COLORS.grayText },
  achievementRightArea: { alignItems: 'flex-end', gap: 6 },
  achievementStatusBadge: { minWidth: 52, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, alignItems: 'center' },
  achievementStatusBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  achievementChevron: { marginRight: 2 },
  helpListItem: { flexDirection: 'row', padding: 15, backgroundColor: '#FAFAFA', borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  helpIconContainer: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  helpTextContainer: { flex: 1 },
  helpItemTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  helpItemDesc: { fontSize: 13, color: COLORS.grayText, lineHeight: 18 },
  guideCloseButton: { marginTop: 10, paddingVertical: 15, borderRadius: 15, alignItems: 'center', elevation: 2 },
  guideCloseButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
