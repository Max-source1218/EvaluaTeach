// screens/SupervisorForm.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, Platform, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import { DEPARTMENTS, SCHOOL_YEARS, SEMESTERS } from '../../constants/options';
import AppSidebar from '../../components/AppSidebar';
import FormPicker from '../../components/FormPicker';
import FormHeader from '../../components/FormHeader';

export default function SupervisorForm() {
  const { token, logout, user } = useAuthStore();
  const router = useRouter();

  const [name, setName]             = useState('');
  const [department, setDepartment] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [semester, setSemester]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const resetForm = () => {
    setName(''); setDepartment(''); setSchoolYear(''); setSemester('');
  };

  const handleSubmit = async () => {
    if (!department || !schoolYear || !semester) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/supervisor-detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          department,
          schoolyear: schoolYear,
          semester,
          role: user?.role || 'Supervisor',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Something went wrong');

      resetForm();
      router.push({
        pathname: '/SupervisorSearch',
        params: { schoolyear: schoolYear, semester, department },
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <AppSidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onLogout={handleLogout}
      />
      <View style={styles.content}>
        <FormHeader title="Supervisor Information" onMenuPress={() => setSidebarVisible(true)} />
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.form}>
            <Text style={styles.label}>Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />

            <FormPicker label="Department *"  selectedValue={department} onValueChange={setDepartment} items={DEPARTMENTS} />
            <FormPicker label="School Year *" selectedValue={schoolYear} onValueChange={setSchoolYear} items={SCHOOL_YEARS} />
            <FormPicker label="Semester *"    selectedValue={semester}   onValueChange={setSemester}   items={SEMESTERS} />

            <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Submitting...' : 'Submit'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, flexDirection: 'row', backgroundColor: '#F5F7FA' },
  content:    { flex: 1, backgroundColor: '#F5F7FA' },
  form:       { padding: 25, paddingTop: 10 },
  label:      { fontSize: 20, color: '#333', marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: '#e5eef1ff', borderRadius: 8, paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 15 : 10,
    fontSize: 16, color: '#333', marginBottom: 20, elevation: 2,
  },
  button: {
    backgroundColor: '#4A90E2', paddingVertical: 15, borderRadius: 30,
    alignItems: 'center', marginTop: 10, width: 100, alignSelf: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
