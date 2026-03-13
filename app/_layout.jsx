import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import SafeScreen from '../components/SafeScreen';

// ✅ All three auth stores checked at root level
import { useAuthStore }        from '../store/authStore';
import { useStudentAuthStore } from '../store/studentAuthStore';
import { useFacultyAuthStore } from '../store/facultyAuthStore';

export default function RootLayout() {
  const { checkAuth: checkAdminAuth   } = useAuthStore();
  const { checkAuth: checkStudentAuth } = useStudentAuthStore();
  const { checkAuth: checkFacultyAuth } = useFacultyAuthStore();

  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    // ✅ All three auth checks run in parallel — loading screen waits for ALL
    Promise.all([
      checkAdminAuth(),
      checkStudentAuth(),
      checkFacultyAuth(),
    ]).finally(() => setIsAuthChecking(false));
  }, []);

  if (isAuthChecking) {
    return (
      <SafeAreaProvider>
        <SafeScreen>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Loading...</Text>
          </View>
        </SafeScreen>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeScreen>
       <Stack screenOptions={{ headerShown: false }}>
  {/* ─── Entry ────────────────────────────────────────── */}
            <Stack.Screen name="index" />

            {/* ─── Auth groups ──────────────────────────────────── */}
            <Stack.Screen name="(auth_admin)" />
            <Stack.Screen name="(auth_student)" />
            <Stack.Screen name="(auth_faculty)" />

            {/* ─── Tab groups ───────────────────────────────────── */}
            <Stack.Screen name="(tabs_admin)" />
            <Stack.Screen name="(tabs_student)" />
            <Stack.Screen name="(tabs_faculty)" />

            {/* ─── Record screens (all tabulation + drill-down screens live here) */}
            <Stack.Screen name="(record_admin)" />
          </Stack>
      </SafeScreen>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}