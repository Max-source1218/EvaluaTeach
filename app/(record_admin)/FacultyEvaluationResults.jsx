import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, SectionList,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import { apiFetch } from '../../lib/apiFetch';
import COLORS from '../../constants/resultColors';

const getRatingLabel = (points) => {
  if (points >= 4.5) return 'Outstanding';
  if (points >= 3.5) return 'Very Satisfactory';
  if (points >= 2.5) return 'Satisfactory';
  if (points >= 1.5) return 'Fair';
  return 'Poor';
};

const getRatingColor = (points) => {
  if (points >= 4.5) return '#28a745';
  if (points >= 3.5) return '#17a2b8';
  if (points >= 2.5) return '#ffc107';
  if (points >= 1.5) return '#fd7e14';
  return '#dc3545';
};

// ✅ Section config — label, icon, evaluatorType key
const SECTIONS_CONFIG = [
  { key: 'Student',       title: 'Student Evaluations',       icon: '👨‍🎓' },
  { key: 'Program Chair', title: 'Program Chair Evaluations', icon: '🪑' },
  { key: 'Supervisor',    title: 'Supervisor Evaluations',    icon: '👔' },
];

export default function FacultyEvaluationResults() {
  const { facultyId, schoolyear, department, semester, subject } = useLocalSearchParams();
  // ✅ facultyDepartment dropped — not needed here
  const { token } = useAuthStore();
  const router = useRouter();

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    if (!facultyId || !schoolyear || !department || !semester || !subject || !token) {
      setError('Missing required parameters.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchEvaluations = async () => {
      try {
       const url = `${API_URL}/faculty-results/results/${facultyId}/${schoolyear}/${department}/${semester}/${encodeURIComponent(subject)}`;
        const data = await apiFetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (cancelled) return;
        setEvaluations(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        Alert.alert('Error', err.message || 'Failed to load evaluations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchEvaluations();
    return () => { cancelled = true; };
  }, [facultyId, schoolyear, department, semester, subject, token]);

  // ✅ useMemo — split into sections only when evaluations change
  const sections = useMemo(() =>
    SECTIONS_CONFIG
      .map(({ key, title, icon }) => ({
        title: `${icon} ${title}`,
        data: evaluations.filter(e => e.evaluatorType === key),
      }))
      .filter(section => section.data.length > 0), // ✅ Hide empty sections
    [evaluations]
  );

  const renderItem = useCallback(({ item }) => {
    const color = getRatingColor(item.points);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-circle-outline" size={40} color={COLORS.primary} />
          <View style={styles.evaluatorText}>
            <Text style={styles.evaluatorName}>{item.name || 'Unknown'}</Text>
            <Text style={styles.evaluatorType}>{item.evaluatorType}</Text>
          </View>
          <View style={[styles.pointsBadge, { backgroundColor: color }]}>
            <Text style={styles.pointsText}>{item.points.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Department:</Text>
            <Text style={styles.detailValue}>{item.department || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rating:</Text>
            <Text style={[styles.detailValue, { color }]}>{getRatingLabel(item.points)}</Text>
          </View>
        </View>
      </View>
    );
  }, []);

  const renderSectionHeader = useCallback(({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length} record(s)</Text>
    </View>
  ), []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading evaluations...</Text>
      </View>
    );
  }

  if (error && evaluations.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={60} color="#dc3545" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Evaluation Results</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{subject}</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>School Year:</Text>
          <Text style={styles.infoValue}>{schoolyear}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Semester:</Text>
          <Text style={styles.infoValue}>{semester}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Department:</Text>
          <Text style={styles.infoValue}>{department}</Text>
        </View>
      </View>

      {/* ✅ SectionList instead of FlatList — proper section rendering */}
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item._id} // ✅ No Math.random()
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        staleWhilePending
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No evaluations found yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: COLORS.background },
  centered:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText:       { marginTop: 10, color: COLORS.textSecondary, fontSize: 16 },
  errorText:         { fontSize: 16, color: '#dc3545', textAlign: 'center', marginVertical: 20 },
  backBtn:           { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, marginTop: 10 },
  backBtnText:       { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  header:            { backgroundColor: COLORS.primary, padding: 20, paddingTop: 40, flexDirection: 'row', alignItems: 'center' },
  backButton:        { marginRight: 15 },
  headerText:        { flex: 1 },
  headerTitle:       { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  headerSubtitle:    { fontSize: 14, color: COLORS.white, opacity: 0.8, marginTop: 2 },
  infoContainer:     { backgroundColor: COLORS.white, padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoRow:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  infoLabel:         { fontSize: 12, color: COLORS.textSecondary },
  infoValue:         { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  listContainer:     { padding: 15, flexGrow: 1 },
  sectionHeader:     { backgroundColor: COLORS.background, paddingVertical: 10, paddingHorizontal: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 8 },
  sectionHeaderText: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  sectionCount:      { fontSize: 13, color: COLORS.textSecondary },
  card:              { backgroundColor: COLORS.cardBackground, borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2, borderWidth: 1, borderColor: COLORS.border },
  cardHeader:        { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  evaluatorText:     { marginLeft: 10, flex: 1 },
  evaluatorName:     { fontSize: 16, fontWeight: '600', color: COLORS.textDark },
  evaluatorType:     { fontSize: 12, color: COLORS.primary, marginTop: 2 },
  pointsBadge:       { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  pointsText:        { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  cardDetails:       { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  detailRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  detailLabel:       { fontSize: 14, color: COLORS.textSecondary },
  detailValue:       { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  emptyContainer:    { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText:         { fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginTop: 15 },
});