import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
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
import AITrainerIcon from '@/components/AITrainerIcon';
import { workoutData } from './globalState';
import { saveProfileToBackend, syncWorkoutData } from '@/lib/workout-sync';

const COLORS = {
  primaryGreen: '#A4C639',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#757575',
  grayBackground: '#E0E0E0',
  aiBubble: '#E8F5E9',
  border: '#EEEEEE',
};

type FieldKey = 'name' | 'age' | 'height' | 'weight' | 'bodyFat';

type Message = {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  fieldKey?: FieldKey;
};

type QuestionConfig = {
  key: FieldKey;
  label: string;
  prompt: string;
  keyboardType: 'default' | 'numeric';
  skippable: boolean;
};

const QUESTIONS: QuestionConfig[] = [
  { key: 'name', label: '名前', prompt: 'まずはあなたの名前を教えてください。', keyboardType: 'default', skippable: false },
  { key: 'age', label: '年齢', prompt: '次に年齢を教えてください。', keyboardType: 'numeric', skippable: true },
  { key: 'height', label: '身長', prompt: '身長(cm)を教えてください。', keyboardType: 'numeric', skippable: true },
  { key: 'weight', label: '体重', prompt: '体重(kg)を教えてください。', keyboardType: 'numeric', skippable: true },
  { key: 'bodyFat', label: '体脂肪率', prompt: '最後に体脂肪率(%)を教えてください。', keyboardType: 'numeric', skippable: true },
];

const INITIAL_AI_MESSAGE = 'こんにちは。muscloopへようこそ。\nまずはあなたのことを少し教えてください。';

function buildInitialMessages(): Message[] {
  return [
    { id: 1, sender: 'ai', text: INITIAL_AI_MESSAGE },
    { id: 2, sender: 'ai', text: QUESTIONS[0].prompt },
  ];
}

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  const [name, setName] = useState(workoutData.userProfile.name || '');
  const [age, setAge] = useState(workoutData.userProfile.age || '');
  const [height, setHeight] = useState(workoutData.userProfile.height || '');
  const [weight, setWeight] = useState(workoutData.userProfile.weight || '');
  const [bodyFat, setBodyFat] = useState(workoutData.userProfile.bodyFat || '');

  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>(buildInitialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<FieldKey | null>(null);

  const fieldValues = useMemo(
    () => ({ name, age, height, weight, bodyFat }),
    [name, age, height, weight, bodyFat],
  );

  const currentQuestion = QUESTIONS[step] ?? null;
  const editingQuestion = editingField ? QUESTIONS.find((question) => question.key === editingField) ?? null : null;
  const activeQuestion = editingQuestion ?? currentQuestion;

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const clearInput = () => {
    setInputText('');
    textInputRef.current?.clear();
  };

  const setFieldValue = (field: FieldKey, value: string) => {
    if (field === 'name') setName(value);
    if (field === 'age') setAge(value);
    if (field === 'height') setHeight(value);
    if (field === 'weight') setWeight(value);
    if (field === 'bodyFat') setBodyFat(value);
  };

  const addAiMessage = (text: string, delay = 500) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now(), sender: 'ai', text }]);
      setIsTyping(false);
      scrollToBottom();
    }, delay);
  };

  const handleSave = async (overrides?: Partial<Record<FieldKey, string>>) => {
    const profile = {
      name: (overrides?.name ?? name).trim() || 'ゲストユーザー',
      age: (overrides?.age ?? age).trim(),
      height: (overrides?.height ?? height).trim(),
      weight: (overrides?.weight ?? weight).trim(),
      bodyFat: (overrides?.bodyFat ?? bodyFat).trim(),
    };

    try {
      setIsSaving(true);
      workoutData.setUserProfile(profile);
      await saveProfileToBackend(profile);
      await syncWorkoutData();

      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 800);
    } catch {
      Alert.alert(
        '保存エラー',
        'プロフィールの保存に失敗しました。バックエンド起動と API 接続先を確認してください。',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnswerSubmit = () => {
    if (!activeQuestion || !inputText.trim()) {
      return;
    }

    const value = inputText.trim();

    if (editingField) {
      setFieldValue(editingField, value);
      setMessages((prev) =>
        prev.map((message) =>
          message.sender === 'user' && message.fieldKey === editingField
            ? { ...message, text: value }
            : message,
        ),
      );
      clearInput();
      setEditingField(null);
      scrollToBottom();

      if (step >= QUESTIONS.length) {
        void handleSave({ [editingField]: value });
      }
      return;
    }

    setFieldValue(activeQuestion.key, value);
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'user', text: value, fieldKey: activeQuestion.key },
    ]);
    clearInput();
    scrollToBottom();

    if (step === QUESTIONS.length - 1) {
      setStep(QUESTIONS.length);
      addAiMessage('ありがとうございます。これで完了です。保存しますね。');
      void handleSave({ [activeQuestion.key]: value });
      return;
    }

    const nextStep = step + 1;
    setStep(nextStep);
    addAiMessage(QUESTIONS[nextStep].prompt);
  };

  const handleSkip = () => {
    if (!currentQuestion || !currentQuestion.skippable || editingField) {
      return;
    }

    setFieldValue(currentQuestion.key, '');
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'user', text: 'あとで入力する', fieldKey: currentQuestion.key },
    ]);
    scrollToBottom();

    if (step === QUESTIONS.length - 1) {
      setStep(QUESTIONS.length);
      addAiMessage('ありがとうございます。これで完了です。保存しますね。');
      void handleSave({ [currentQuestion.key]: '' });
      return;
    }

    const nextStep = step + 1;
    setStep(nextStep);
    addAiMessage(QUESTIONS[nextStep].prompt);
  };

  const handleEditPress = (field: FieldKey) => {
    if (isSaving || isTyping) {
      return;
    }

    setEditingField(field);
    setInputText(fieldValues[field] ?? '');
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 50);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    clearInput();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>プロフィール設定</Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.sender === 'user' ? styles.messageWrapperUser : styles.messageWrapperAi,
              ]}
            >
              {message.sender === 'ai' && <AITrainerIcon size={32} style={styles.aiIcon} />}

              {message.sender === 'user' ? (
                <View style={styles.userMessageGroup}>
                  <View style={[styles.bubble, styles.userBubble]}>
                    <Text style={styles.messageText}>{message.text}</Text>
                  </View>
                  {message.fieldKey ? (
                    <TouchableOpacity
                      style={styles.editChip}
                      onPress={() => handleEditPress(message.fieldKey!)}
                      disabled={isSaving || isTyping}
                    >
                      <Ionicons name="pencil" size={12} color={COLORS.grayText} />
                      <Text style={styles.editChipText}>編集</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <View style={[styles.bubble, styles.aiBubble]}>
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
              )}
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageWrapper, styles.messageWrapperAi]}>
              <AITrainerIcon size={32} style={styles.aiIcon} />
              <View style={[styles.bubble, styles.aiBubble]}>
                <Text style={styles.messageText}>入力中...</Text>
              </View>
            </View>
          )}

          {isSaving && (
            <View style={[styles.messageWrapper, styles.messageWrapperAi]}>
              <AITrainerIcon size={32} style={styles.aiIcon} />
              <View style={[styles.bubble, styles.aiBubble]}>
                <Text style={styles.messageText}>保存中...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {editingQuestion ? (
          <View style={styles.editingBanner}>
            <Text style={styles.editingBannerText}>{editingQuestion.label}を編集中</Text>
            <TouchableOpacity style={styles.cancelEditButton} onPress={handleCancelEdit}>
              <Text style={styles.cancelEditButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {currentQuestion && currentQuestion.skippable && !editingField && !isSaving && !isTyping ? (
          <View style={styles.skipContainer}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>あとで入力する</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            placeholder={
              activeQuestion
                ? `${activeQuestion.label}${activeQuestion.keyboardType === 'numeric' ? 'を入力' : 'を入力'}`
                : '入力してください'
            }
            placeholderTextColor={COLORS.grayText}
            value={inputText}
            onChangeText={setInputText}
            keyboardType={activeQuestion?.keyboardType ?? 'default'}
            editable={!isSaving && !isTyping && Boolean(activeQuestion)}
            onSubmitEditing={handleAnswerSubmit}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSaving || isTyping || !activeQuestion) && styles.sendButtonDisabled,
            ]}
            onPress={handleAnswerSubmit}
            disabled={!inputText.trim() || isSaving || isTyping || !activeQuestion}
          >
            <Ionicons name={editingField ? 'checkmark' : 'send'} size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    marginRight: 8,
  },
  userMessageGroup: {
    alignItems: 'flex-end',
    maxWidth: '78%',
  },
  bubble: {
    maxWidth: '100%',
    padding: 14,
    borderRadius: 20,
  },
  aiBubble: {
    maxWidth: '75%',
    backgroundColor: COLORS.aiBubble,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: COLORS.white,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  editChip: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F1F3F5',
  },
  editChipText: {
    fontSize: 12,
    color: COLORS.grayText,
    fontWeight: '600',
  },
  editingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EFF7E3',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  editingBannerText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  cancelEditButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelEditButtonText: {
    fontSize: 12,
    color: COLORS.grayText,
    fontWeight: '600',
  },
  skipContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
