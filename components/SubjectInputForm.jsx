import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { API_URL } from '../constants/api';
import { SEMESTERS, SCHOOL_YEARS } from '../constants/options';
import { apiFetch } from '../lib/apiFetch';

export default function SubjectInputForm({
  token,
  instructorId,
  accentColor = '#4CAF50',
  headerTitle = 'Add Subject',
  showEmail = false,
}) {
  const router = useRouter();

  const [title,          setTitle]          = useState('');
  const [semester,       setSemester]       = useState('');
  const [schoolyear,     setSchoolyear]     = useState('');
  const [loading,        setLoading]        = useState(false);
  const [fetchingInstructor, setFetchingInstructor] = useState(false);
  const [instructorData, setInstructorData] = useState(null);

  // ✅ Fetch instructor details on mount — department comes from their profile
  useEffect(() => {
    if (!instructorId || !token) return;
    let cancelled = false;

    const fetchInstructor = async () => {
      setFetchingInstructor(true);
      try {
        // ✅ Try faculty endpoint first, fall back to user (program chair)
        const data = await apiFetch(`${API_URL}/faculty/${instructorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) setInstructorData(data);
      } catch {
        // Not a faculty — try user endpoint
        try {
          const data = await apiFetch(`${API_URL}/admin/user/${instructorId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!cancelled) setInstructorData(data);
        } catch {
          if (!cancelled) Alert.alert('Warning', 'Could not load instructor details');
        }
      } finally {
        if (!cancelled) setFetchingInstructor(false);
      }
    };

    fetchInstructor();
    return () => { cancelled = true; };
  }, [instructorId, token]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !semester || !schoolyear) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (!instructorId) {
      Alert.alert('Error', 'No instructor selected');
      return;
    }

    setLoading(true);
    try {
      await apiFetch(`${API_URL}/subject`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          title:        title.trim(),
          semester,
          schoolyear,
          // ✅ Department always from instructor's profile — not user-editable
          department:   instructorData?.department,
          instructorId,
        }),
      });

      Alert.alert('Success', 'Subject added successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, [title, semester, schoolyear, instructorId, instructorData, token]);

  const accentStyle = { color: accentColor };
  const btnStyle    = { backgroundColor: accentColor };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{headerTitle}</Text>
      </View>

      {/* ✅ Instructor info card — with loading state */}
      {fetchingInstructor ? (
        <View style={styles.infoCard}>
          <ActivityIndicator size="small" color={accentColor} />
          <Text style={styles.loadingText}>Loading instructor details...</Text>
        </View>
      ) : instructorData ? (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={24} color={accentColor} />
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{instructorData.username || instructorData.name}</Text>
          </View>
          {/* ✅ Department shown as READ-ONLY — subject inherits from instructor */}
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={24} color={accentColor} />
            <Text style={styles.infoLabel}>Department:</Text>
            <Text style={[styles.infoValue, accentStyle]}>{instructorData.department}</Text>
          </View>
          {/* ✅ Email row only shown for PC view (showEmail prop) */}
          {showEmail && instructorData.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={24} color={accentColor} />
              <Text style={styles.infoLabel}>User ID:</Text>
              <Text style={styles.infoValue}>{instructorData.email}</Text>
            </View>
          )}
          <View style={styles.deptNote}>
            <Ionicons name="information-circle-outline" size={14} color="#888" />
            <Text style={styles.deptNoteText}>
              Subject will be assigned to {instructorData.department} department
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>No instructor selected</Text>
        </View>
      )}

      <View style={styles.form}>
        {/* Subject Title */}
        <Text style={styles.label}>Subject Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Introduction to Computing"
          placeholderTextColor="#767676"
          value={title}
          onChangeText={setTitle}
          autoCapitalize="words"
        />

        {/* Semester */}
        <Text style={styles.label}>Semester *</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={semester}
            onValueChange={setSemester}
            style={styles.picker}
            dropdownIconColor={accentColor}
            mode="dropdown"
          >
            <Picker.Item label="Select Semester" value="" />
            {/* ✅ Uses shared SEMESTERS constant */}
            {SEMESTERS.map((s) => (
              <Picker.Item key={s} label={s} value={s} />
            ))}
          </Picker>
        </View>

        {/* School Year */}
        <Text style={styles.label}>School Year *</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={schoolyear}
            onValueChange={setSchoolyear}
            style={styles.picker}
            dropdownIconColor={accentColor}
            mode="dropdown"
          >
            <Picker.Item label="Select School Year" value="" />
            {/* ✅ Uses shared SCHOOL_YEARS constant */}
            {SCHOOL_YEARS.map((sy) => (
              <Picker.Item key={sy} label={sy} value={sy} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.button, btnStyle]}
          onPress={handleSubmit}
          disabled={loading || fetchingInstructor}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Add Subject</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F5F7FA' },
  header:        { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  title:         { fontSize: 24, fontWeight: 'bold', color: '#333', marginLeft: 15 },
  infoCard:      { backgroundColor: 'white', marginHorizontal: 20, marginTop: 10, padding: 15, borderRadius: 10, elevation: 2, alignItems: 'flex-start' },
  infoRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoLabel:     { fontSize: 16, color: '#666', marginLeft: 10, marginRight: 5 },
  infoValue:     { fontSize: 16, fontWeight: '600', color: '#333' },
  loadingText:   { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10 },
  deptNote:      { flexDirection: 'row', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#f0f0f0', alignSelf: 'stretch' },
  deptNoteText:  { fontSize: 12, color: '#888', marginLeft: 4 },
  form:          { padding: 20 },
  label:         { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 10 },
  input:         { backgroundColor: 'white', borderRadius: 8, padding: 15, fontSize: 16, color: '#333', marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  pickerWrapper: { backgroundColor: 'white', borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  picker:        { color: '#333', height: 50 },
  button:        { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  buttonText:    { color: 'white', fontSize: 18, fontWeight: 'bold' },
});