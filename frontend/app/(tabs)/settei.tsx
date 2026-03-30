import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
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

import { workoutData } from '../globalState';
import { saveProfileToBackend, syncWorkoutData } from '@/lib/workout-sync';

const COLORS = {
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#8E8E93',
  divider: '#E0E0E0',
  accent: '#FFD700',
};

const THEME_OPTIONS = [
  { name: 'Android', color: '#A4C639' },
  { name: 'Ocean', color: '#2196F3' },
  { name: 'Fire', color: '#FF5252' },
  { name: 'Grape', color: '#9C27B0' },
  { name: 'Midnight', color: '#37474F' },
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
  return workoutData.equippedBadge || '🌱 はじまりの一歩';
}

function getInitialProfileState(): ProfileState {
  return {
    name: getDefaultName(),
    rank: getDefaultBadge(),
    height: workoutData.userProfile?.height || '170',
    weight: workoutData.userProfile?.weight || '65.5',
    bodyFat: workoutData.userProfile?.bodyFat || '18.5',
    avatar: workoutData.userProfile?.avatar || null,
  };
}

export default function ProfileScreen() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [vibeEnabled, setVibeEnabled] = useState(workoutData.isVibrationEnabled);
  const [notificationPermissionRaw, setNotificationPermissionRaw] = useState<Notifications.PermissionStatus | 'undetermined'>('undetermined');
  const [isCheckingNotificationPermission, setIsCheckingNotificationPermission] = useState(false);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [theme, setTheme] = useState(workoutData.themeColor);
  const [profile, setProfile] = useState<ProfileState>(getInitialProfileState());
  const isPersistingNameRef = useRef(false);

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
    }, []),
  );

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

  const unlockedBadges = [
    { id: 'default_0', name: 'はじまりの一歩', icon: '🌱' },
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
      equippedBadge: options?.equippedBadge ?? nextProfile.rank ?? workoutData.equippedBadge ?? '🌱 はじまりの一歩',
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
        rank: previousBadge || '🌱 はじまりの一歩',
        height: previousProfile.height || '170',
        weight: previousProfile.weight || '65.5',
        bodyFat: previousProfile.bodyFat || '18.5',
        avatar: previousProfile.avatar || null,
      });
    }
  };

  const syncNotificationPermissionState = useCallback(async () => {
    try {
      setIsCheckingNotificationPermission(true);
      const settings = await Notifications.getPermissionsAsync();
      setNotificationPermissionRaw(settings.status);
      await persistProfileState(undefined, { syncAfterSave: false });
    } catch {
      setNotificationPermissionRaw('undetermined');
    } finally {
      setIsCheckingNotificationPermission(false);
    }
  }, [profile]);

  useEffect(() => {
    if (!showNotifyModal) return;

    void syncNotificationPermissionState();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncNotificationPermissionState();
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
      const imageUri = result.assets[0].uri;
      setProfile((prev) => ({ ...prev, avatar: imageUri }));
      void persistProfileState({ avatar: imageUri }, { syncAfterSave: false });
    }
  };

  const handleSelectBadge = (badgeIcon: string, badgeName: string) => {
    const fullBadgeString = `${badgeIcon} ${badgeName}`;
    setProfile((prev) => ({ ...prev, rank: fullBadgeString }));
    setShowBadgeModal(false);
    void persistProfileState({ rank: fullBadgeString }, { syncAfterSave: false, equippedBadge: fullBadgeString });
  };

  const handleThemeChange = () => {
    const currentIndex = THEME_OPTIONS.findIndex((opt) => opt.color === theme);
    const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
    const nextTheme = THEME_OPTIONS[nextIndex];
    void persistProfileState(undefined, { syncAfterSave: false, themeColor: nextTheme.color });
  };

  const handleLogout = () => {
    workoutData.resetData();
    router.replace('/');
  };

  const toggleVibe = (value: boolean) => {
    void persistProfileState(undefined, { syncAfterSave: false, isVibrationEnabled: value });
  };

  const requestNotificationPermission = async () => {
    try {
      setIsCheckingNotificationPermission(true);
      const settings = await Notifications.requestPermissionsAsync();
      setNotificationPermissionRaw(settings.status);
      await persistProfileState(undefined, { syncAfterSave: false });
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
          <TouchableOpacity style={styles.avatarCircle} onPress={pickImage} activeOpacity={0.8}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={50} color={theme} />
            )}
            <View style={[styles.cameraBadge, { backgroundColor: theme }]}>
              <Ionicons name="camera" size={14} color={COLORS.white} />
            </View>
          </TouchableOpacity>

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
        {value}
        <Text style={styles.statusUnit}> {unit}</Text>
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
