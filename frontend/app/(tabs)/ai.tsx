import { useRouter } from 'expo-router'; // ★戻るボタン用
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primaryGreen: '#A4C639',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#757575',
  aiBubble: '#E8F5E9', // AIの吹き出し色
  userBubble: '#A4C639', // ユーザーの吹き出し色（テーマカラー）
};

export default function AiChatScreen() {
  const router = useRouter(); // ★戻るボタンのリモコン

  // ★ダミーのチャットデータ（後で作る予定の「ガワ」）
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'こんにちは！今日のメニューを一緒に考えましょう！🤖' },
    { id: 2, sender: 'ai', text: '今日の体調や、鍛えたい部位（腕、腹、足など）を教えてください！' },
  ]);
  const [inputText, setInputText] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      {/* --- ヘッダー --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/home')}>
          <Text style={styles.backButtonText}>＜ 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AIトレーナー相談</Text>
        <View style={{ width: 60 }} /> {/* 左右のバランスを取るためのダミー */}
      </View>

      {/* --- チャットエリア（キーボードに合わせて自動調整） --- */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Android向けの調整
      >
        <ScrollView 
          contentContainerStyle={styles.chatContent}
          contentInsetAdjustmentBehavior="never" // 例のSE向け魔法！
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[
              styles.bubbleWrapper,
              msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper
            ]}>
              {msg.sender === 'ai' && (
                <View style={styles.aiAvatar}>
                  <Text style={styles.aiAvatarText}>🤖</Text>
                </View>
              )}
              <View style={[
                styles.bubble,
                msg.sender === 'user' ? styles.userBubble : styles.aiBubble
              ]}>
                <Text style={[
                  styles.bubbleText,
                  msg.sender === 'user' ? styles.userBubbleText : styles.aiBubbleText
                ]}>{msg.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* --- 入力バー（下部に固定） --- */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="メッセージを入力..."
            placeholderTextColor={COLORS.grayText}
            value={inputText}
            onChangeText={setInputText}
            multiline // 複数行入力対応
          />
          <TouchableOpacity style={styles.sendButton}>
            <Text style={styles.sendButtonText}>送信</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
  },
  backButton: {
    paddingVertical: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primaryGreen,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  chatContent: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 20,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 15,
    maxWidth: '80%', // 吹き出しの最大幅
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  userWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse', // ユーザーは右側に寄せる
  },
  aiAvatar: {
    backgroundColor: COLORS.white,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  aiAvatarText: {
    fontSize: 20,
  },
  bubble: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
  },
  aiBubble: {
    backgroundColor: COLORS.aiBubble,
    borderTopLeftRadius: 5, // AIの吹き出しは左上が尖る
  },
  userBubble: {
    backgroundColor: COLORS.userBubble,
    borderTopRightRadius: 5, // ユーザーの吹き出しは右上が尖る
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  aiBubbleText: {
    color: COLORS.text,
  },
  userBubbleText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  inputBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 25 : 15, // iPhone SEの下部余白対応
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    marginRight: 10,
    maxHeight: 100, // 入力欄が伸びすぎないように制限
  },
  sendButton: {
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
});