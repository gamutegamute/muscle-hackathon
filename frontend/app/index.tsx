import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ensureGuestUserId } from '@/lib/guest-session';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleGuestLogin = async () => {
    await ensureGuestUserId();
    router.replace('/profile');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <Text style={styles.appName}>Muscle App</Text>
          <Text style={styles.subTitle}>Workout Support</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.formFields}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.inputField}
              placeholder="example@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.fieldLabel, styles.passwordLabel]}>Password</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Enter password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton} activeOpacity={0.8}>
            <Text style={styles.loginButtonLabel}>Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => void handleGuestLogin()}>
            <Text style={styles.guestText}>Start without login (Guest)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 50,
    gap: 24,
    backgroundColor: '#f2f2f7',
  },
  header: {
    alignItems: 'center',
    gap: 10,
    width: 220,
  },
  logoBox: {
    width: 100,
    height: 100,
    backgroundColor: '#8ac75a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#030303',
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  formSection: {
    alignItems: 'center',
    gap: 20,
    width: 350,
  },
  formFields: {
    width: 350,
    gap: 5,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 5,
    marginTop: 10,
  },
  passwordLabel: {
    marginTop: 6,
  },
  inputField: {
    width: 350,
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: '#EAEAEA',
    borderRadius: 25,
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    width: 350,
    height: 48,
    backgroundColor: '#8ac75a',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginButtonLabel: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  footer: {
    width: 350,
    marginTop: 20,
  },
  guestText: {
    width: 350,
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 20,
  },
});
