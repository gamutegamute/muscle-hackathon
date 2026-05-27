import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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

import { workoutData } from './globalState';
import { saveProfileToBackend, syncWorkoutData } from '@/lib/workout-sync';
import AchievementsModal from '@/components/AchievementsModal';

const COLORS = {
  primaryGreen: '#A4C639',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#757575',
  grayBackground: '#E0E0E0',
  aiBubble: '#E8F5E9',
};

type Message = {
  id: number;
  sender: 'ai' | 'user';
  text: string;
};

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [name, setName] = useState(workoutData.userProfile.name || '');
  const [age, setAge] = useState(workoutData.userProfile.age || '');
  const [height, setHeight] = useState(workoutData.userProfile.height || '');
  const [weight, setWeight] = useState(workoutData.userProfile.weight || '');
  const [bodyFat, setBodyFat] = useState(workoutData.userProfile.bodyFat || '');
  
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showAchievements, setShowAchievements] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'こんにちは！muscloopへようこそ。\nまずはあなたの名前を教えてくれるかな？',
    },
  ]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const addAiMessage = (text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now(), sender: 'ai', text }]);
      setIsTyping(false);
      scrollToBottom();
    }, 600); // 人間らしい「間」
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: userText }]);
    setInputText('');
    scrollToBottom();

    if (step === 0) {
      setName(userText);
      setStep(1);
      addAiMessage(`ありがとう、${userText}さん！\n次は年齢を教えてね。`);
    } else if (step === 1) {
      setAge(userText);
      setStep(2);
      addAiMessage('OK！次は身長（cm）を教えてね。');
    } else if (step === 2) {
      setHeight(userText);
      setStep(3);
      addAiMessage('なるほど！次は体重（kg）を教えてね。');
    } else if (step === 3) {
      setWeight(userText);
      setStep(4);
      addAiMessage('ありがとう！最後に体脂肪率（%）を教えてね。');
    } else if (step === 4) {
      setBodyFat(userText);
      setStep(5);
      
      setIsTyping(true);
      setTimeout(async () => {
        setMessages((prev) => [...prev, { id: Date.now(), sender: 'ai', text: 'これで完了！保存するね！' }]);
        setIsTyping(false);
        scrollToBottom();
        
        await handleSave(userText);
      }, 600);
    }
  };

  const handleSkip = () => {
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: 'あとで入力する' }]);
    scrollToBottom();
    
    setStep(step + 1);

    if (step === 1) {
      setAge('');
      addAiMessage('OK！次は身長（cm）を教えてね。');
    } else if (step === 2) {
      setHeight('');
      addAiMessage('なるほど！次は体重（kg）を教えてね。');
    } else if (step === 3) {
      setWeight('');
      addAiMessage('ありがとう！最後に体脂肪率（%）を教えてね。');
    } else if (step === 4) {
      setBodyFat('');
      
      setIsTyping(true);
      setTimeout(async () => {
        setMessages((prev) => [...prev, { id: Date.now(), sender: 'ai', text: 'これで完了！保存するね！' }]);
        setIsTyping(false);
        scrollToBottom();
        
        await handleSave('');
      }, 600);
    }
  };

  const handleSave = async (finalBodyFat: string) => {
    const profile = {
      name: name.trim() || 'ゲストユーザー',
      age: age.trim(),
      height: height.trim(),
      weight: weight.trim(),
      bodyFat: finalBodyFat ? finalBodyFat.trim() : '',
    };

    try {
      setIsSaving(true);
      workoutData.setUserProfile(profile);
      await saveProfileToBackend(profile);
      await syncWorkoutData();
      
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 1000);
    } catch {
      Alert.alert(
        '保存エラー',
        'プロフィールの保存に失敗しました。バックエンド起動と API 接続先を確認してください。',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getKeyboardType = () => {
    if (step === 0) return 'default';
    return 'numeric';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>プロフィール設定</Text>
          <TouchableOpacity onPress={() => setShowAchievements(true)}>
            <Ionicons name="trophy-outline" size={24} color={COLORS.primaryGreen} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageWrapper,
                msg.sender === 'user' ? styles.messageWrapperUser : styles.messageWrapperAi,
              ]}
            >
              {msg.sender === 'ai' && (
                <View style={styles.aiIcon}>
                  <Text style={{ fontSize: 18 }}>🤖</Text>
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text style={styles.messageText}>{msg.text}</Text>
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageWrapper, styles.messageWrapperAi]}>
              <View style={styles.aiIcon}>
                <Text style={{ fontSize: 18 }}>🤖</Text>
              </View>
              <View style={[styles.bubble, styles.aiBubble]}>
                <Text style={styles.messageText}>入力中...</Text>
              </View>
            </View>
          )}

          {isSaving && (
            <View style={[styles.messageWrapper, styles.messageWrapperAi]}>
              <View style={styles.aiIcon}>
                <Text style={{ fontSize: 18 }}>🤖</Text>
              </View>
              <View style={[styles.bubble, styles.aiBubble]}>
                <Text style={styles.messageText}>保存中...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {step > 0 && step <= 4 && !isSaving && !isTyping && (
          <View style={styles.skipContainer}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>後で入力する</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={step === 0 ? "名前を入力" : "数値を入力"}
            placeholderTextColor={COLORS.grayText}
            value={inputText}
            onChangeText={setInputText}
            keyboardType={getKeyboardType()}
            editable={!isSaving && step <= 4 && !isTyping}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSaving || isTyping) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSaving || isTyping}
          >
            <Ionicons name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <AchievementsModal 
        visible={showAchievements} 
        onClose={() => setShowAchievements(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  messageWrapperAi: {
    justifyContent: 'flex-start',
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  bubble: {
    maxWidth: '75%',
    padding: 14,
    borderRadius: 20,
  },
  aiBubble: {
    backgroundColor: COLORS.aiBubble,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: COLORS.white,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  skipContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: COLORS.grayBackground,
  },
  skipButtonText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: COLORS.primaryGreen,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.grayText,
    opacity: 0.5,
  },
});
