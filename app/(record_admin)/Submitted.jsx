import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ResponseRecordedScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.title}>Response Recorded</Text>
        <Text style={styles.subtitle}>Thank you for your input!</Text>
      </View>

      {/* ✅ replace instead of push — clears back stack */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/(tabs_admin)/Dashboard')}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  content:    { alignItems: 'center', marginBottom: 50 },
  icon:       { fontSize: 60, marginBottom: 20 },
  title:      { fontSize: 28, fontWeight: 'bold', color: '#28a745', textAlign: 'center', marginBottom: 10 },
  subtitle:   { fontSize: 16, color: '#6c757d', textAlign: 'center' },
  button:     { backgroundColor: '#007bff', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});