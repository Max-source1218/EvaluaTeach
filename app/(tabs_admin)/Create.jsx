import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert, TextInput,
  ActivityIndicator, Image, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import { DEPARTMENTS } from '../../constants/options';
import styles from '../../assets/styles/create.styles';

const MIN_PASSWORD_LENGTH = 6;
const MIN_USERNAME_LENGTH = 3;

export default function Create() {
  const { token, user } = useAuthStore();
  const router          = useRouter();

  const [username,            setUsername]            = useState('');
  const [email,               setEmail]               = useState('');
  const [password,            setPassword]            = useState('');
  const [confirmPassword,     setConfirmPassword]     = useState('');
  const [department,          setDepartment]          = useState('');
  const [profileImage,        setProfileImage]        = useState(null);
  const [submitting,          setSubmitting]          = useState(false);
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const pickImage = async () => {
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) setProfileImage(result.assets[0]);
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validate = () => {
  if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !department) {
    Alert.alert('Error', 'Please fill all required fields');
    return false;
  }
  if (username.length < MIN_USERNAME_LENGTH) {
    Alert.alert('Error', `Username must be at least ${MIN_USERNAME_LENGTH} characters`);
    return false;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    Alert.alert('Error', `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    return false;
  }
  if (password !== confirmPassword) {
    Alert.alert('Error', 'Passwords do not match');
    return false;
  }
  return true;
};

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      // ✅ Must use native fetch — FormData with image requires multipart/form-data
      // apiFetch sets Content-Type: application/json so it cannot be used here
      const formData = new FormData();
      formData.append('username',   username);
      formData.append('email',      email);
      formData.append('password',   password);
      formData.append('department', department);

      if (profileImage) {
        formData.append('profileImage', {
          uri:  profileImage.uri,
          type: 'image/jpeg',
          name: 'faculty-profile.jpg',
        });
      }

      const response = await fetch(`${API_URL}/faculty/register`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to register faculty');

      // ✅ No state reset needed — screen unmounts on navigation
      Alert.alert('Success', 'Faculty registered successfully!', [
        { text: 'OK', onPress: () => router.push('/Profile') },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isSupervisor = user?.role === 'Supervisor';

  return (
    <ScrollView style={styles.scrollViewStyle} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Register Faculty</Text>
            {/* ✅ Clearer subtitle per role */}
            <Text style={styles.subtitle}>
              {isSupervisor
                ? 'Register a new faculty member as Supervisor'
                : 'Register a new faculty member as Program Chair'}
            </Text>
          </View>

          {/* Profile Photo */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Profile Photo</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage.uri }} style={styles.previewImage} />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="camera-outline" size={40} color="#999" />
                  <Text style={styles.placeholderText}>Tap to upload photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Username */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Username *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Email / User ID */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>User ID *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter User ID"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(v => !v)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Department */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Department *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={department}
                onValueChange={setDepartment}
                style={styles.picker}
              >
                <Picker.Item label="Select Department" value="" />
                {DEPARTMENTS.map((dept) => (
                  <Picker.Item key={dept} label={dept} value={dept} />
                ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Register Faculty</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}