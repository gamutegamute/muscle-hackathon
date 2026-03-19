import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function Index() {
  const [menuName, setMenuName] = useState('');
  const [count, setCount] = useState('');
  const [duration, setDuration] = useState('');
  const [memo, setMemo] = useState('');

const handleSave = async () => {
  try {
    const res = await fetch("http://localhost:8000/records", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "test-user",
        menuName,
        count: Number(count),
        duration: Number(duration),
        memo,
      }),
    });

    const data = await res.json();
    console.log("成功:", data);
    alert("保存成功！");
  } catch (err) {
    console.error(err);
    alert("保存失敗");
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>記録の入力</Text>

      <TextInput
        style={styles.input}
        placeholder="メニュー名"
        value={menuName}
        onChangeText={setMenuName}
      />

      <TextInput
        style={styles.input}
        placeholder="回数"
        value={count}
        onChangeText={setCount}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="時間"
        value={duration}
        onChangeText={setDuration}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.memoInput}
        placeholder="メモ"
        value={memo}
        onChangeText={setMemo}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>保存</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F7F7F7',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#EAEAEA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  memoInput: {
    backgroundColor: '#EAEAEA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
    height: 140,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#8BC34A',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});