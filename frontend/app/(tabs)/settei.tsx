import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // ★追加：ログアウト移動用
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primaryGreen: '#A4C639',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#8E8E93',
  divider: '#E0E0E0',
};

// --- 型の定義（赤線を消すための修正版） ---
interface StatusItemProps {
  label: string;
  value: string;
  unit: string;
  isEditing: boolean;
  onChange: (val: string) => void;
}

interface MenuLinkProps {
  icon: any; // ★ここを any にすることで hasIcon のエラーを回避
  label: string;
  color?: string;
  onPress?: () => void; // ★タップ時の動作を追加
}

export default function ProfileScreen() {
  const router = useRouter(); // ★リモコン準備
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '筋肉太郎',
    rank: '⭐ 習慣化のタマゴ',
    height: '170',
    weight: '65.5',
    bodyFat: '18.5',
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>マイページ</Text>

        {/* --- 1. ユーザーヘッダー --- */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={50} color={COLORS.grayText} />
          </View>
          <Text style={styles.userName}>{profile.name}</Text>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{profile.rank}</Text>
          </View>
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
          {/* ★ ログアウトボタンに onPress を追加 */}
          <MenuLink 
            icon="log-out-outline" 
            label="ログアウト" 
            color="#FF3B30" 
            onPress={() => router.replace('/')} 
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// --- 小さな部品 ---

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  userName: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  rankBadge: { backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FFD700' },
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
});