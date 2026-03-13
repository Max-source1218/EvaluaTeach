import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SafeScreen from "../../components/SafeScreen";
import { StatusBar } from 'expo-status-bar';

export default function AuthRoutesLayout() {
  
  return <SafeAreaProvider>
      <SafeScreen>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="sign-in(admin)" />
          <Stack.Screen name="sign-up(admin)" />
        </Stack>
      </SafeScreen>
      <StatusBar style="dark" />
    </SafeAreaProvider>
};
