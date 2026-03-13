import { useState, useRef, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, Pressable, Image,
  Animated, Easing, ScrollView, Alert, ActivityIndicator,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_URL } from '../constants/api';
import { apiFetch } from '../lib/apiFetch';

import logo from "@/assets/images/58908bc2-67dc-4cfb-bf14-c19b4451d558.jpg";

export default function SearchScreen({ config }) {
  const { schoolyear, semester, department } = useLocalSearchParams();
  const router = useRouter();

  const [instructors, setInstructors]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [selected, setSelected]         = useState(null);
  const [subject, setSubject]           = useState(null);

  // ✅ Single animation value instead of 3 — reduces memory footprint
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const paramsValid = schoolyear && semester && department && config?.token;

  useEffect(() => {
    if (!paramsValid) {
      setError('Missing required parameters. Please go back and try again.');
      setLoading(false);
      return;
    }

    let cancelled = false; // ✅ Prevents state update on unmounted component

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = config.fetchUrl({ schoolyear, semester, department });
        const data = await apiFetch(url, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (cancelled) return; // ✅ Don't update state if screen was left

        setInstructors(config.extractInstructors(data) || []);

        // ✅ One animation instead of staggered 3 — lighter on memory
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }).start();
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        Alert.alert('Error', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    // ✅ Cleanup — cancels state updates if user navigates away mid-fetch
    return () => { cancelled = true; };
  }, [schoolyear, semester, department, config?.token]);

  const instructorOptions = useMemo(() =>
    instructors.map((inst, i) => ({
      label: inst.name || `Unknown ${i + 1}`,
      value: inst._id,
    })),
    [instructors]
  );

  const subjectOptions = useMemo(() => {
    if (!selected) return [];
    const found = instructors.find(inst => inst._id === selected);
    return found?.subjects?.map((sub, i) => ({
      label: sub.title || `Subject ${i + 1}`,
      value: sub._id,
    })) || [];
  }, [selected, instructors]);

  const handleNavigate = () => {
    if (!selected || !subject) return;

    const selectedInst = instructors.find(inst => inst._id === selected);
    const selectedSubj = selectedInst?.subjects?.find(sub => sub._id === subject);

    if (!selectedInst || !selectedSubj) {
      Alert.alert('Error', 'Please select both an instructor and a subject.');
      return;
    }

    router.push({
      pathname: config.navigateTo,
      params: config.buildParams(
        { schoolyear, semester, department },
        selectedInst,
        selectedSubj
      ),
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading {config.instructorLabel}s...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={60} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true} // ✅ Reduces memory on long lists
      >
        <Image source={logo} style={styles.headerImg} />
        <Text style={styles.header}>
          Select a {config.instructorLabel} Based on Their Details
        </Text>

        <View style={styles.filterInfo}>
          <Text style={styles.filterText}>Department: {department}</Text>
          <Text style={styles.filterText}>School Year: {schoolyear}</Text>
          <Text style={styles.filterText}>Semester: {semester}</Text>
        </View>

        {instructors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No {config.instructorLabel}s found</Text>
            <Text style={styles.emptySubtext}>
              Make sure subjects are assigned for this department, semester, and school year.
            </Text>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </Pressable>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, width: "100%" }}>
            <Text style={styles.title}>Select a {config.instructorLabel}:</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={instructorOptions}
              labelField="label"
              valueField="value"
              placeholder={`Choose a ${config.instructorLabel}`}
              value={selected}
              onChange={(item) => {
                setSelected(item.value);
                setSubject(null);
              }}
              maxHeight={150}
              showsVerticalScrollIndicator={false}
            />

            <Text style={styles.title}>Select What Subject They Teach:</Text>
            <Dropdown
              style={[styles.dropdown, !selected && styles.dropdownDisabled]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={subjectOptions}
              labelField="label"
              valueField="value"
              placeholder={selected ? "What Subject?" : `Select a ${config.instructorLabel} first`}
              value={subject}
              onChange={(item) => setSubject(item.value)}
              maxHeight={150}
              showsVerticalScrollIndicator={false}
              disable={!selected}
            />

            <Pressable
              style={[styles.btn, (!selected || !subject) && styles.btnDisabled]}
              disabled={!selected || !subject}
              onPress={handleNavigate}
            >
              <Text style={styles.btntext}>Go To Evaluation Form</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background:        { flex: 1, backgroundColor: "#f5f7fa" },
  container:         { padding: 26, alignItems: "center", flexGrow: 1 },
  centered:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText:       { marginTop: 10, fontSize: 16, color: '#666' },
  errorText:         { fontSize: 16, color: '#ef4444', textAlign: 'center', marginVertical: 20 },
  retryButton:       { backgroundColor: '#4A90E2', padding: 15, borderRadius: 10 },
  retryButtonText:   { color: 'white', fontSize: 16, fontWeight: 'bold' },
  headerImg:         { width: 110, height: 110, borderRadius: 55, marginBottom: 20, borderWidth: 2, borderColor: "#2b598d" },
  header:            { fontSize: 26, fontWeight: "700", color: "#2b598d", marginBottom: 30, textAlign: "center" },
  filterInfo:        { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20, width: '100%', elevation: 2 },
  filterText:        { fontSize: 16, color: '#333', marginBottom: 5 },
  emptyContainer:    { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText:         { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 20 },
  emptySubtext:      { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10, marginBottom: 20 },
  backButton:        { backgroundColor: '#4A90E2', padding: 15, borderRadius: 10 },
  backButtonText:    { color: 'white', fontSize: 16, fontWeight: 'bold' },
  title:             { fontSize: 20, fontWeight: "600", color: "#1f2937", marginBottom: 10 },
  dropdown:          { height: 50, borderColor: "#2b598d", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, backgroundColor: "white", marginBottom: 30 },
  dropdownDisabled:  { opacity: 0.5 },
  placeholderStyle:  { fontSize: 16, color: "#6b7280" },
  selectedTextStyle: { fontSize: 16, color: "#1f2937" },
  btn:               { width: '100%', backgroundColor: "#1274e4ff", borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  btnDisabled:       { backgroundColor: '#a0c4f1' },
  btntext:           { fontSize: 18, fontWeight: "700", color: "white" },
});