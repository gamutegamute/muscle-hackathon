import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { workoutData } from '../globalState';
import { getAdvice } from '@/lib/api';
import { getApiConnectionHelpMessage } from '@/lib/workout-sync';

const COLORS = {
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#757575',
  aiBubble: '#E8F5E9',
};

type Message = {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  showRecordButton?: boolean;
  menuData?: { name: string; count: number; sets: number; mins: number; secs: number };
};

const LEVEL_OPTIONS = ['初心者（これから始める）', '中級者（週1〜2回）', '上級者（ガチ勢🔥）'];
const LEVEL_PROMPTS: Record<string, string[]> = {
  '初心者（これから始める）': ['今日のメニューは？', '筋肉痛がひどい…', 'プロテインって必要？'],
  '中級者（週1〜2回）': ['今日のメニューは？', '停滞期を抜け出したい', '分割法って？'],
  '上級者（ガチ勢🔥）': ['今日のメニューは？', 'MAX重量を伸ばす', '追い込みのコツ'],
};

export default function AiChatScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [theme, setTheme] = useState(workoutData.themeColor);
  const [userLevel, setUserLevel] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'はじめまして！あなたの専属AIトレーナーです。\nまずは、普段の運動レベルを教えてください！',
    },
  ]);
  const [inputText, setInputText] = useState('');

  useFocusEffect(
    useCallback(() => {
      setTheme(workoutData.themeColor);
    }, []),
  );

  const currentSuggestions = userLevel ? LEVEL_PROMPTS[userLevel] ?? LEVEL_OPTIONS : LEVEL_OPTIONS;

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const checkAndNavigate = () => {
    if (workoutData.latestAchievementId) {
      router.push({
        pathname: '/record_complete',
        params: { fromAi: 'true' },
      });
    }
  };

  const appendAiMessages = (nextMessages: Message[]) => {
    setMessages((prev) => [...prev, ...nextMessages]);
    scrollToBottom();
  };

  const requestAdvice = async (topic: string, message?: string) => {
    setIsTyping(true);
    scrollToBottom();

    try {
      const advice = await getAdvice({
        userId: workoutData.getUserId(),
        topic,
        level: userLevel,
        message,
      });

      const summaryText =
        advice.summary.recentMenus.length > 0
          ? `最近は ${advice.summary.recentMenus.slice(0, 2).join('、')} に取り組めています。`
          : 'まだ記録が少ないので、まずは続けやすい内容から整えていきましょう。';

      appendAiMessages([
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: advice.message,
        },
        {
          id: Date.now() + 2,
          sender: 'ai',
          text: `${summaryText}\nこのメニューなら今の流れに合わせて続けやすいです。`,
          showRecordButton: true,
          menuData: {
            name: advice.recommendation.menuName,
            count: advice.recommendation.count,
            sets: advice.recommendation.sets,
            mins: advice.recommendation.mins,
            secs: advice.recommendation.secs,
          },
        },
      ]);
    } catch {
      Alert.alert('AI相談に失敗しました', getApiConnectionHelpMessage());
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionPress = async (prompt: string) => {
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: prompt }]);
    scrollToBottom();

    workoutData.incrementAiCount();
    checkAndNavigate();

    if (userLevel === null) {
      setUserLevel(prompt);
      appendAiMessages([
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `${prompt}ですね！承知しました。\nあなたの記録も見ながら、合いそうなメニューを提案していきますね。`,
        },
        {
          id: Date.now() + 2,
          sender: 'ai',
          text: '今日の体調や、聞きたいことがあれば下のボタンかメッセージで送ってください！',
        },
      ]);
      return;
    }

    await requestAdvice(prompt);
  };

  const handleSend = async () => {
    if (!inputText.trim()) {
      return;
    }

    const nextText = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: nextText }]);
    scrollToBottom();

    workoutData.incrementAiCount();
    checkAndNavigate();

    if (userLevel === null) {
      appendAiMessages([
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'まずは運動レベルを教えてもらえると、あなた向けの提案がかなりしやすくなります！',
        },
      ]);
      return;
    }

    await requestAdvice(nextText, nextText);
  };

  const handleRecordCompletePress = (menuData?: Message['menuData']) => {
    if (menuData) {
      router.push({
        pathname: '/(tabs)/kiroku',
        params: {
          menu: menuData.name,
          count: String(menuData.count),
          sets: String(menuData.sets),
          mins: String(menuData.mins),
          secs: String(menuData.secs),
        },
      });
      return;
    }

    router.push('/(tabs)/kiroku');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.white }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/home')}>
          <Text style={[styles.backButtonText, { color: theme }]}>＜ 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AIトレーナー相談</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContent}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.bubbleWrapper, msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}
            >
              {msg.sender === 'ai' && (
                <View style={styles.aiAvatar}>
                  <Text style={styles.aiAvatarText}>🤖</Text>
                </View>
              )}
              <View style={[styles.bubble, msg.sender === 'user' ? { backgroundColor: theme } : styles.aiBubble]}>
                <Text
                  style={[
                    styles.bubbleText,
                    msg.sender === 'user' ? styles.userBubbleText : styles.aiBubbleText,
                  ]}
                >
                  {msg.text}
                </Text>

                {msg.showRecordButton && (
                  <TouchableOpacity
                    style={[styles.recordCompleteButton, { backgroundColor: theme }]}
                    onPress={() => handleRecordCompletePress(msg.menuData)}
                  >
                    <Text style={styles.recordCompleteButtonText}>このメニューで記録する</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.bubbleWrapper, styles.aiWrapper]}>
              <View style={styles.aiAvatar}>
                <Text style={styles.aiAvatarText}>🤖</Text>
              </View>
              <View style={[styles.bubble, styles.aiBubble, { paddingVertical: 8, paddingHorizontal: 20 }]}>
                <Text style={[styles.bubbleText, styles.aiBubbleText, { fontSize: 24, letterSpacing: 2 }]}>
                  ・・・
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputArea}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionList}
            contentContainerStyle={styles.suggestionListContent}
          >
            {currentSuggestions.map((prompt) => (
              <TouchableOpacity key={prompt} style={styles.suggestionButton} onPress={() => void handleSuggestionPress(prompt)}>
                <Text style={styles.suggestionButtonText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="メッセージを入力..."
              placeholderTextColor={COLORS.grayText}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme }]} onPress={() => void handleSend()}>
              <Text style={styles.sendButtonText}>送信</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  backButton: { paddingVertical: 5 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  chatContent: { paddingHorizontal: 15, paddingTop: 20, paddingBottom: 20 },
  bubbleWrapper: { flexDirection: 'row', marginBottom: 15, maxWidth: '85%' },
  aiWrapper: { alignSelf: 'flex-start' },
  userWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
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
    zIndex: 1,
  },
  aiAvatarText: { fontSize: 20 },
  bubble: { paddingHorizontal: 15, paddingVertical: 12, borderRadius: 15, position: 'relative' },
  aiBubble: { backgroundColor: COLORS.aiBubble, borderTopLeftRadius: 5 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  aiBubbleText: { color: COLORS.text },
  userBubbleText: { color: COLORS.white, fontWeight: '500' },
  inputArea: { backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  suggestionList: { paddingVertical: 10, backgroundColor: COLORS.white },
  suggestionListContent: { paddingHorizontal: 15, gap: 10 },
  suggestionButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  suggestionButtonText: { fontSize: 14, color: COLORS.text },
  inputBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
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
    maxHeight: 100,
  },
  sendButton: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  sendButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
  recordCompleteButton: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recordCompleteButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
});
