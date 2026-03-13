import {
  View, Text, Platform, KeyboardAvoidingView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator
} from "react-native";
import styles from "../../assets/styles/signup.styles.student";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useStudentAuthStore } from "../../store/studentAuthStore"; // ✅ fixed import

const PRIMARY_COLOR = '#4A90E2';

const SignUpScreen = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, register } = useStudentAuthStore();
  const router = useRouter();

  const handleSignup = async () => {
    // ✅ Added validation — was missing entirely
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    const result = await register(username, email, password);

    if (result.success) {
      router.replace('/(tabs_student)/Student_Form');
    } else {
      Alert.alert("Error", result.error);
    }
  };

  // ✅ Removed console.log(student) and console.log(token) from render body

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>EvaluaTeach 📗</Text>
            <Text style={styles.subtitle}>Evaluate Your Instructors</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Maximillian Reth B. Cruz"
                  placeholderTextColor="#767676"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>User ID</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="24-1-7-0001"
                  placeholderTextColor="#767676"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="*******"
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
              onPress={handleSignup}
              disabled={isLoading}
              accessibilityLabel={isLoading ? "Signing up" : "Sign up button"}
            >
              {isLoading
                ? <ActivityIndicator size="large" color="#fff" />
                : <Text style={styles.buttonText}>Sign Up</Text>
              }
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.link}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;