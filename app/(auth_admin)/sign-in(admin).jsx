import {
  View, Text, KeyboardAvoidingView, TextInput,
  TouchableOpacity, ActivityIndicator, Platform, Alert, Image
} from "react-native";
import styles from "../../assets/styles/login.styles.admin";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";

const PRIMARY_COLOR = '#4A90E2';

const SignInScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, login } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both User ID and Password.");
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      // ✅ No setTimeout needed — state is set before result returns
      router.replace('/(tabs_admin)/Dashboard');
    } else {
      Alert.alert("Login Failed", result.error);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.container}>
        <View style={styles.topIllustration}>
          <Image
            source={require("../../assets/images/auth.png")}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>User ID</Text>
              <View style={styles.inputContainer}>
                {/* ✅ Fixed: use constant color, not styles.primary */}
                <Ionicons name="apps" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your User ID"
                  placeholderTextColor="#767676"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#767676"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={PRIMARY_COLOR}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
              {isLoading
                ? <ActivityIndicator size="large" color="#fff" />
                : <Text style={styles.buttonText}>Login</Text>
              }
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Link href="/(auth_admin)/sign-up(admin)" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SignInScreen;