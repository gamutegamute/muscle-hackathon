import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { workoutData } from '@/app/globalState';

const COLORS = {
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#8E8E93',
};

type AchievementItem = {
  id: string;
  icon: string;
  name: string;
  detail: string;
  conditionText: string;
};

const ACHIEVEMENT_ITEMS: AchievementItem[] = [
  {
    id: 'default_0',
    icon: '🥚',
    name: 'はじまりの一歩',
    detail: 'アプリを始めた最初の実績です。',
    conditionText: '条件: アプリを使い始める',
  },
  {
    id: 'streak_3',
    icon: '🔥',
    name: '3日連続の挑戦者',
    detail: '3日連続でトレーニングを続けた証です。',
    conditionText: '条件: 3日連続で記録する',
  },
  {
    id: 'streak_7',
    icon: '🏅',
    name: '継続のルーキー',
    detail: '1週間しっかり積み上げたときに取れる実績です。',
    conditionText: '条件: 7日連続で記録する',
  },
  {
    id: 'streak_14',
    icon: '💪',
    name: '2週間の努力家',
    detail: '2週間続けられたときに解放される実績です。',
    conditionText: '条件: 14日連続で記録する',
  },
  {
    id: 'streak_30',
    icon: '👑',
    name: '筋肉の王者',
    detail: '1か月継続した人だけが取れる実績です。',
    conditionText: '条件: 30日連続で記録する',
  },
  {
    id: 'time_100',
    icon: '⏱️',
    name: '努力の積み上げ',
    detail: 'コツコツ積み上げて合計100分を超えた証です。',
    conditionText: '条件: 合計100分以上トレーニングする',
  },
  {
    id: 'time_500',
    icon: '🏆',
    name: '筋肉の勲章',
    detail: 'かなり頑張った人向けの大きな実績です。',
    conditionText: '条件: 合計500分以上トレーニングする',
  },
  {
    id: 'ai_1',
    icon: '🤖',
    name: 'AIとの出会い',
    detail: 'AI相談を初めて使ったときに取れる実績です。',
    conditionText: '条件: AI相談を1回使う',
  },
  {
    id: 'ai_5',
    icon: '🧠',
    name: 'AIマニア',
    detail: 'AI相談をたくさん活用した人向けの実績です。',
    conditionText: '条件: AI相談を5回使う',
  },
  {
    id: 'weekly_1',
    icon: '🥇',
    name: '今週のトップランナー',
    detail: '今週のフレンドランキングで1位になった実績です。',
    conditionText: '条件: 今週のランキング1位になる',
  },
  {
    id: 'weekly_2',
    icon: '🏆',
    name: '2週連続チャンピオン',
    detail: '2週連続でランキング1位を獲得した実績です。',
    conditionText: '条件: 2週連続でランキング1位になる',
  },
  {
    id: 'weekly_3',
    icon: '👑',
    name: '3週連続キング',
    detail: '3週連続でランキング1位を守り抜いた実績です。',
    conditionText: '条件: 3週連続でランキング1位になる',
  },
  {
    id: 'weekly_5',
    icon: '🏅',
    name: '5週連続キング',
    detail: '5週連続でランキング1位を維持した実績です。',
    conditionText: '条件: 5週連続でランキング1位になる',
  },
  {
    id: 'weekly_ten',
    icon: '🎖️',
    name: '今週のスプリント',
    detail: '今週のフレンドランキングで上位10位以内に入った実績です。',
    conditionText: '条件: 今週のランキング10位以内になる',
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AchievementsModal({ visible, onClose }: Props) {
  const [theme, setTheme] = useState(workoutData.themeColor);
  const [pageVersion, setPageVersion] = useState(0);

  useEffect(() => {
    if (visible) {
      setTheme(workoutData.themeColor);
      setPageVersion((v) => v + 1);
    }
  }, [visible]);

  const achievements = ACHIEVEMENT_ITEMS.map((achievement) => ({
    ...achievement,
    unlocked: achievement.id === 'default_0' || workoutData.unlockedAchievements.includes(achievement.id),
  }));
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  const showAchievementDetail = (achievement: AchievementItem & { unlocked: boolean }) => {
    if (!achievement.unlocked) {
      return;
    }
    Alert.alert(achievement.name, `${achievement.detail}\n\n${achievement.conditionText}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.pageTitle}>実績一覧</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} key={pageVersion}>
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
                onPress={() => showAchievementDetail(achievement)}
                disabled={!achievement.unlocked}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: achievement.unlocked ? `${theme}15` : '#F1F1F1' },
                  ]}
                >
                  <Text style={styles.iconText}>{achievement.unlocked ? achievement.icon : '???'}</Text>
                </View>

                <View style={styles.achievementBody}>
                  <Text style={[styles.achievementName, !achievement.unlocked && styles.lockedText]}>
                    {achievement.unlocked ? achievement.name : '？？？'}
                  </Text>
                  <Text style={styles.achievementMeta}>
                    {achievement.unlocked ? 'タップで詳細を表示' : '未取得'}
                  </Text>
                </View>

                <View style={styles.rightArea}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: achievement.unlocked ? theme : '#D8D8D8' },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{achievement.unlocked ? 'GET' : 'LOCK'}</Text>
                  </View>
                  {achievement.unlocked ? (
                    <Ionicons name="chevron-forward" size={18} color={theme} style={styles.chevron} />
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerSpacer: {
    width: 30,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.text,
  },
  summaryHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    gap: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  achievementBody: {
    flex: 1,
  },
  achievementName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  achievementMeta: {
    fontSize: 12,
    color: COLORS.grayText,
  },
  lockedText: {
    letterSpacing: 1,
  },
  rightArea: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    minWidth: 52,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chevron: {
    marginRight: 2,
  },
});
