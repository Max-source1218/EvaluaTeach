import {
  View, Text, KeyboardAvoidingView, TextInput,
  TouchableOpacity, ActivityIndicator, Platform, Image, Alert
} from "react-native";
import styles from "../../assets/styles/login.styles.student";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useStudentAuthStore } from "../../store/studentAuthStore"; // ✅ fixed import

const PRIMARY_COLOR = '#4A90E2';

const SignInScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, login } = useStudentAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both User ID and Password.");
      return;
    }

    // ✅ No setTimeout — direct async call
    const result = await login(email, password);

    if (result.success) {
      router.replace('/(tabs_student)/Student_Form');
    } else {
      // ✅ Stay on login screen on error, don't navigate away
      Alert.alert("Login Failed", result.error);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.container}>
        <View style={styles.topIllustration}>
          <Image
            source={require("../../assets/images/auth_student.png")}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>User ID</Text>
              <View style={styles.inputContainer}>
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

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={isLoading}
              accessibilityLabel={isLoading ? "Logging in" : "Login button"}
            >
              {isLoading
                ? <ActivityIndicator size="large" color="#fff" />
                : <Text style={styles.buttonText}>Login</Text>
              }
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Link href="/(auth_student)/sign-up(student)" asChild>
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