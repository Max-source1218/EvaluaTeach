// (tabs_student)/StudentForm.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, Platform, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStudentAuthStore } from '../../store/studentAuthStore'; // ✅ fixed
import { API_URL } from '../../constants/api';
import { apiFetch } from '../../lib/apiFetch';                      // ✅ shared helper
import {
  DEPARTMENTS, COURSES, YEAR_LEVELS, SCHOOL_YEARS, SEMESTERS
} from '../../constants/options';
import AppSidebar from '../../components/AppSidebar';
import FormPicker from '../../components/FormPicker';
import FormHeader from '../../components/FormHeader';

export default function StudentForm() {
  const { token, logout } = useStudentAuthStore(); // ✅ fixed
  const router = useRouter();

  const [name, setName]               = useState('');
  const [department, setDepartment]   = useState('');
  const [course, setCourse]           = useState('');
  const [yearLevel, setYearLevel]     = useState('');
  const [schoolYear, setSchoolYear]   = useState('');
  const [semester, setSemester]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const resetForm = () => {
    setName(''); setDepartment(''); setCourse('');
    setYearLevel(''); setSchoolYear(''); setSemester('');
  };

  const handleSubmit = async () => {
    if (!department || !course || !yearLevel || !schoolYear || !semester) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // ✅ Clean fetch using shared helper — no manual text parsing
      await apiFetch(`${API_URL}/student-detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          department,
          course,
          year_level: yearLevel,
          schoolyear: schoolYear,
          semester,
        }),
      });

      resetForm();
      router.push({
        pathname: '/StudentSearch',
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
        <FormHeader
          title="Student Information"
          onMenuPress={() => setSidebarVisible(true)}
        />
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
            <FormPicker label="Course *"      selectedValue={course}     onValueChange={setCourse}     items={COURSES} />
            <FormPicker label="Year Level *"  selectedValue={yearLevel}  onValueChange={setYearLevel}  items={YEAR_LEVELS} />
            <FormPicker label="School Year *" selectedValue={schoolYear} onValueChange={setSchoolYear} items={SCHOOL_YEARS} />
            <FormPicker label="Semester *"    selectedValue={semester}   onValueChange={setSemester}   items={SEMESTERS} />

            <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Submitting...' : 'Continue'}</Text>
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