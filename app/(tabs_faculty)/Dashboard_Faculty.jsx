import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFacultyAuthStore } from "../../store/facultyAuthStore";
import { API_URL } from '../../constants/api';
import { apiFetch } from '../../lib/apiFetch';

const getRatingDescription = (points) => {
  if (points >= 4.5) return 'Outstanding';
  if (points >= 3.5) return 'Very Satisfactory';
  if (points >= 2.5) return 'Satisfactory';
  if (points >= 1.5) return 'Fair';
  return 'Poor';
};

const COLORS = {
  primary:        "#EC407A",
  textPrimary:    "#7d2150",
  textSecondary:  "#b06a8f",
  textDark:       "#5a1836",
  placeholderText:"#767676",
  background:     "#fce4ec",
  cardBackground: "#fff5f8",
  inputBackground:"#fef8fa",
  border:         "#f8bbd0",
  white:          "#ffffff",
  black:          "#000000",
};

const getRatingColor = (points) => {
  if (points >= 4.5) return '#28a745';
  if (points >= 3.5) return '#17a2b8';
  if (points >= 2.5) return '#ffc107';
  if (points >= 1.5) return '#fd7e14';
  return '#dc3545';
};

export default function Dashboard_Faculty() {
  const { faculty, token, logout } = useFacultyAuthStore();
  const router = useRouter();

  const [schoolYears,        setSchoolYears]        = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(null);
  const [subjects,           setSubjects]           = useState([]);
  const [selectedSubject,    setSelectedSubject]    = useState(null);
  const [evaluations,        setEvaluations]        = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [view,               setView]               = useState('schoolYears');

  // ✅ Fetch school years on mount
  useEffect(() => {
    if (!faculty?._id || !token) return;
    let cancelled = false;

    const fetch = async () => {
      try {
        const data = await apiFetch(`${API_URL}/faculty-results/schoolyears/${faculty._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // ✅ /schoolyears returns plain string array — no .schoolyear needed
        if (!cancelled) setSchoolYears(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) Alert.alert('Error', err.message || 'Failed to load school years');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [faculty?._id, token]);

  const fetchSubjects = useCallback(async (schoolyear) => {
    let cancelled = false;
    setLoading(true);
    try {
      const data = await apiFetch(
        `${API_URL}/faculty-results/dashboard/subjects/${faculty._id}/${schoolyear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!cancelled) {
        setSubjects(Array.isArray(data) ? data : []);
        setSelectedSchoolYear(schoolyear);
        setView('subjects');
      }
    } catch (err) {
      if (!cancelled) Alert.alert('Error', err.message || 'Failed to load subjects');
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => { cancelled = true; };
  }, [faculty?._id, token]);

  const fetchEvaluations = useCallback(async (schoolyear, subject) => {
    let cancelled = false;
    setLoading(true);
    try {
      const data = await apiFetch(
        `${API_URL}/faculty-results/dashboard/results/${faculty._id}/${schoolyear}/${encodeURIComponent(subject)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!cancelled) {
        setEvaluations(Array.isArray(data) ? data : []);
        setSelectedSubject(subject);
        setView('evaluations');
      }
    } catch (err) {
      if (!cancelled) Alert.alert('Error', err.message || 'Failed to load evaluations');
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => { cancelled = true; };
  }, [faculty?._id, token]);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  }, [logout]);

  const goBack = useCallback(() => {
    if (view === 'evaluations') {
      setView('subjects');
      setSelectedSubject(null);
      setEvaluations([]);
    } else if (view === 'subjects') {
      setView('schoolYears');
      setSelectedSchoolYear(null);
      setSubjects([]);
    }
  }, [view]);

  const renderSchoolYearItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => fetchSubjects(item)}  // ✅ item is plain string now
    >
      <View style={styles.cardHeader}>
        <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
        <Text style={styles.cardTitle}>{item}</Text>
      </View>
      {/* ✅ Removed item.count — endpoint no longer returns count */}
      <Text style={styles.cardSubtitle}>Tap to view subjects</Text>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} style={styles.chevron} />
    </TouchableOpacity>
  ), [fetchSubjects]);

  const renderSubjectItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => fetchEvaluations(selectedSchoolYear, item)}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="book-outline" size={24} color={COLORS.primary} />
        <Text style={styles.cardTitle}>{item}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} style={styles.chevron} />
    </TouchableOpacity>
  ), [fetchEvaluations, selectedSchoolYear]);

  const renderEvaluationItem = useCallback(({ item }) => {
    const color = getRatingColor(item.points);
    return (
      <View style={styles.evaluationCard}>
        <View style={styles.evaluationHeader}>
          <View style={styles.evaluatorInfo}>
            <Ionicons name="person-circle-outline" size={40} color={COLORS.primary} />
            <View style={styles.evaluatorText}>
              <Text style={styles.evaluatorLabel}>Evaluated by:</Text>
              <Text style={styles.evaluatorName}>{item.name || 'Anonymous Evaluator'}</Text>
              <Text style={styles.evaluatorType}>
                {item.evaluatorType === 'Student' ? '👨‍🎓 Student' : '👨‍💼 Program Chair'}
              </Text>
            </View>
          </View>
          <View style={[styles.ratingBadge, { backgroundColor: color }]}>
            <Text style={styles.ratingText}>{item.points.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.evaluationDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Semester:</Text>
            <Text style={styles.detailValue}>{item.semester}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Department:</Text>
            <Text style={styles.detailValue}>{item.department}</Text>
          </View>
        </View>

        <View style={styles.ratingDescriptionContainer}>
          <Text style={[styles.ratingDescription, { color }]}>{getRatingDescription(item.points)}</Text>
        </View>
      </View>
    );
  }, []);

  const renderEmpty = useCallback((message) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-open-outline" size={60} color={COLORS.border} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  ), []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>EvaluaTeach ✒️</Text>
        <Text style={styles.headerSubtitle}>My Evaluation Results</Text>
        <Text style={styles.welcomeText}>Welcome, {faculty?.username || 'Faculty'}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {view !== 'schoolYears' && (
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={
          view === 'schoolYears' ? schoolYears :
          view === 'subjects'    ? subjects    :
          evaluations
        }
        renderItem={
          view === 'schoolYears' ? renderSchoolYearItem :
          view === 'subjects'    ? renderSubjectItem    :
          renderEvaluationItem
        }
        keyExtractor={(item, index) =>
          view === 'subjects' ? item :
          item._id?.toString() || index.toString()  // ✅ no Math.random()
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={renderEmpty(
          view === 'schoolYears' ? 'No school years found' :
          view === 'subjects'    ? 'No subjects found for this school year' :
          'No evaluations found for this subject'
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:                { flex: 1, backgroundColor: COLORS.background },
  loadingContainer:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText:              { marginTop: 10, color: COLORS.textSecondary, fontSize: 16 },
  header:                   { padding: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle:              { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
  headerSubtitle:           { fontSize: 18, color: COLORS.textPrimary, marginTop: 5 },
  welcomeText:              { fontSize: 14, color: COLORS.textSecondary, marginTop: 5 },
  logoutButton:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, marginHorizontal: 15, marginTop: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary },
  logoutButtonText:         { marginLeft: 8, color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  backButton:               { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: COLORS.white, marginHorizontal: 15, marginTop: 10, borderRadius: 10, elevation: 2 },
  backButtonText:           { marginLeft: 5, color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  listContainer:            { padding: 15 },
  card:                     { backgroundColor: COLORS.cardBackground, borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  cardHeader:               { flexDirection: 'row', alignItems: 'center' },
  cardTitle:                { fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginLeft: 10 },
  cardSubtitle:             { fontSize: 14, color: COLORS.textSecondary, marginTop: 5, marginLeft: 34 },
  chevron:                  { position: 'absolute', right: 0, top: 2 },
  evaluationCard:           { backgroundColor: COLORS.cardBackground, borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2, borderWidth: 1, borderColor: COLORS.border },
  evaluationHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  evaluatorInfo:            { flexDirection: 'row', alignItems: 'center' },
  evaluatorText:            { marginLeft: 10 },
  evaluatorLabel:           { fontSize: 12, color: COLORS.textSecondary },
  evaluatorName:            { fontSize: 16, fontWeight: '600', color: COLORS.textDark },
  evaluatorType:            { fontSize: 12, color: COLORS.primary, marginTop: 2 },
  ratingBadge:              { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  ratingText:               { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  evaluationDetails:        { marginBottom: 10 },
  detailRow:                { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  detailLabel:              { fontSize: 14, color: COLORS.textSecondary },
  detailValue:              { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  ratingDescriptionContainer: { alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  ratingDescription:        { fontSize: 16, fontWeight: '600' },
  emptyContainer:           { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText:                { marginTop: 10, fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' },
});