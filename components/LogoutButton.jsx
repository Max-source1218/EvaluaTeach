import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { useRouter } from 'expo-router'; 
import styles from '../assets/styles/profile.styles';

export default function LogoutButton() {
  const { logout } = useAuthStore();
  const router = useRouter(); 

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Logout",
        onPress: async () => {
          await logout(); // ✅ wait for AsyncStorage to clear before navigating
          router.replace("/");
        },
        style: "destructive"
      }
    ]);
  };

  return (
    <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
      <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  );
}