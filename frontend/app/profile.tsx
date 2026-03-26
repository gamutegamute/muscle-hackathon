import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

const COLORS = {
  primaryGreen: '#A4C639',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayBackground: '#E0E0E0',
  divider: '#C7C7CC',
};

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const [name, setName] = useState(workoutData.userProfile.name || '');
  const [age, setAge] = useState(workoutData.userProfile.age || '');
  const [height, setHeight] = useState(workoutData.userProfile.height || '');
  const [weight, setWeight] = useState(workoutData.userProfile.weight || '');
  const [bodyFat, setBodyFat] = useState(workoutData.userProfile.bodyFat || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const profile = {
      name: name.trim() || 'Guest User',
      age: age.trim() || '20',
      height: height.trim() || '170',
      weight: weight.trim() || '65',
      bodyFat: bodyFat.trim() || '18',
    };

    try {
      setIsSaving(true);
      workoutData.setUserProfile(profile);
      await saveProfileToBackend(profile);
      await syncWorkoutData();
      router.replace('/(tabs)/home');
    } catch {
      Alert.alert(
        'Save Error',
        'Failed to save profile. Please check backend startup and API base URL.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="never"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile Setup</Text>
          </View>

          <View style={styles.formContainer}>
            <InputCard label="Name" value={name} onChangeText={setName} placeholder="Name" />
            <InputCard label="Age" value={age} onChangeText={setAge} placeholder="Age" keyboardType="numeric" />
            <InputCard
              label="Height"
              value={height}
              onChangeText={setHeight}
              placeholder="Height"
              keyboardType="numeric"
            />
            <InputCard
              label="Weight"
              value={weight}
              onChangeText={setWeight}
              placeholder="Weight"
              keyboardType="numeric"
            />
            <InputCard
              label="Body Fat"
              value={bodyFat}
              onChangeText={setBodyFat}
              placeholder="Body Fat"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save and Start'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type InputCardProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
};

function InputCard({ label, value, onChangeText, placeholder, keyboardType = 'default' }: InputCardProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.divider} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  formContainer: {
    gap: 10,
    marginBottom: 40,
  },
  inputGroup: {
    backgroundColor: COLORS.grayBackground,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: 10,
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 5,
  },
  saveButton: {
    backgroundColor: COLORS.primaryGreen,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
});
