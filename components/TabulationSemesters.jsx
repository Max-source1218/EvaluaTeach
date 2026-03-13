import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../lib/apiFetch';
import COLORS from '../constants/resultColors';

export default function TabulationSemesters({
  fetchUrl,
  token,
  headerTitle,
  headerSubtitle,
  navigateTo,
  buildParams,
}) {
  const router = useRouter();
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!fetchUrl || !token) { setLoading(false); return; }

    let cancelled = false;

    const fetchSemesters = async () => {
      try {
        // ✅ Both /faculty-results/semesters and /program-chair-results/semesters
        // return plain string arrays — no normalization needed
        const data = await apiFetch(fetchUrl, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!cancelled) setSemesters(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) Alert.alert('Error', err.message || 'Failed to load semesters');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSemesters();
    return () => { cancelled = true; };
  }, [fetchUrl, token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading semesters...</Text>
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
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
        </View>
      </View>

      <FlatList
        data={semesters}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: navigateTo, params: buildParams(item) })}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="school-outline" size={24} color={COLORS.primary} />
              <Text style={styles.cardTitle}>{item}</Text>
            </View>
            <Text style={styles.cardSubtitle}>View tabulated results</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} style={styles.chevron} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No semesters found</Text>
            <Text style={styles.emptySubtext}>No evaluations exist for this school year.</Text>
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
  listContainer:  { padding: 15, flexGrow: 1 },
  card:           { backgroundColor: COLORS.cardBackground, borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  cardHeader:     { flexDirection: 'row', alignItems: 'center' },
  cardTitle:      { fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginLeft: 10 },
  cardSubtitle:   { fontSize: 14, color: COLORS.textSecondary, marginTop: 5, marginLeft: 34 },
  chevron:        { position: 'absolute', right: 0, top: 15 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText:      { fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginTop: 15 },
  emptySubtext:   { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
});