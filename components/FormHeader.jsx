// components/FormHeader.jsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const PRIMARY_COLOR = '#4A90E2';

export default function FormHeader({ title, onMenuPress }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onMenuPress} style={styles.hamburger}>
        <Text style={styles.hamburgerText}>☰</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 20,
    backgroundColor: '#F5F7FA', borderBottomWidth: 1,
    borderBottomColor: '#ddd', elevation: 2,
  },
  hamburger: { padding: 5, marginRight: 15 },
  hamburgerText: { fontSize: 24, color: PRIMARY_COLOR },
  title: {
    fontSize: 28, fontWeight: '700', color: PRIMARY_COLOR,
    flex: 1, textAlign: 'center', textDecorationLine: 'underline',
  },
});