import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import { apiFetch } from '../../lib/apiFetch';
import COLORS from '../../constants/resultColors';

export default function ChairSchoolYear() {
  const { userId, chairDepartment, userType } = useLocalSearchParams(); // ✅ renamed params
  const { token } = useAuthStore();
  const router = useRouter();

  const [schoolYears, setSchoolYears] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!userId || !token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSchoolYears = async () => {
      try {
        // ✅ Backend returns [{ schoolyear: "2024-2025" }, ...]
        const data = await apiFetch(
          `${API_URL}/program-chair-results/schoolyears/${userId}`,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
        if (!cancelled) setSchoolYears(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) Alert.alert('Error', err.message || 'Failed to load school years');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSchoolYears();
    return () => { cancelled = true; };
  }, [userId, token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading school years...</Text>
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
          <Text style={styles.headerTitle}>Select School Year</Text>
          <Text style={styles.headerSubtitle}>Program Chair Evaluation Results</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>Department</Text>
        <Text style={styles.infoValue}>{chairDepartment || 'N/A'}</Text>
      </View>

      <FlatList
        data={schoolYears}
        keyExtractor={(item) => item.schoolyear} // ✅ object, not string
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        removeClippedSubviews={true}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({
              pathname: '/chairDepartments',
              params: {
                userId,
                chairDepartment,
                userType,
                schoolyear: item.schoolyear, // ✅ extract from object
              },
            })}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
              <Text style={styles.cardTitle}>{item.schoolyear}</Text>
            </View>
            <Text style={styles.cardSubtitle}>View evaluation results</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} style={styles.chevron} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No school years found</Text>
            <Text style={styles.emptySubtext}>This program chair has no evaluation records yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:    { marginTop: 10, color: COLORS.textSecondary, fontSize: 16 },
  header:         { backgroundColor: COLORS.primary, padding: 20, paddingTop: 40, flexDirection: 'row', alignItems: 'center' },
  backButton:     { marginRight: 15 },
  headerText:     { flex: 1 },
  headerTitle:    { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  headerSubtitle: { fontSize: 14, color: COLORS.white, opacity: 0.8, marginTop: 2 },
  infoContainer:  { backgroundColor: COLORS.white, padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel:      { fontSize: 12, color: COLORS.textSecondary },
  infoValue:      { fontSize: 16, color: COLORS.textPrimary, fontWeight: '600', marginTop: 2 },
  listContainer:  { padding: 15, flexGrow: 1 },
  card:           { backgroundColor: COLORS.cardBackground, borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  cardHeader:     { flexDirection: 'row', alignItems: 'center' },
  cardTitle:      { fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginLeft: 10 },
  cardSubtitle:   { fontSize: 14, color: COLORS.textSecondary, marginTop: 5, marginLeft: 34 },
  chevron:        { position: 'absolute', right: 0, top: 15 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText:      { fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginTop: 15 },
  emptySubtext:   { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 10 },
});