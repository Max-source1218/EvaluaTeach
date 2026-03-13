import {
  View, Text, Platform, KeyboardAvoidingView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, ScrollView
} from "react-native";
import styles from "../../assets/styles/signup.styles.admin";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { Picker } from "@react-native-picker/picker";

const PRIMARY_COLOR = '#4A90E2';

const SignUpScreen = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, register } = useAuthStore();
  const router = useRouter();

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }
    if (!role) {
      Alert.alert("Error", "Please select a role.");
      return;
    }

    const result = await register(username, email, password, role);

    if (result.success) {
      // ✅ Navigate to Dashboard after successful registration
      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.replace('/(tabs_admin)/Dashboard') }
      ]);
    } else {
      Alert.alert("Error", result.error);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>EvaluaTeach ✒️</Text>
              <Text style={styles.subtitle}>Manage The Evaluation</Text>
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
                  <Ionicons name="card-outline" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="23-1-7-0012"
                    placeholderTextColor="#767676"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Role *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={role}
                    onValueChange={setRole}
                    style={styles.picker}
                    dropdownIconColor={PRIMARY_COLOR}
                    mode="dropdown"
                  >
                    <Picker.Item label="Select your Role" value="" />
                    <Picker.Item label="Program Chair" value="Program Chair" />
                    <Picker.Item label="Supervisor" value="Supervisor" />
                  </Picker>
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

              <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={isLoading}>
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
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;