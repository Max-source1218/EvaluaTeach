import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import { apiFetch } from '../../lib/apiFetch';

const COLORS = {
  primary:       '#4CAF50',
  textPrimary:   '#2e5a2e',
  textSecondary: '#688f68',
  textDark:      '#1b361b',
  background:    '#e8f5e9',
  cardBackground:'#f1f8f2',
  border:        '#c8e6c9',
  white:         '#ffffff',
};

// ✅ Role badge color — Faculty green, Program Chair blue
const ROLE_COLORS = {
  'Faculty':       { bg: '#e8f5e9', text: '#2e7d32' },
  'Program Chair': { bg: '#e3f2fd', text: '#1565c0' },
};

export default function Subjects() {
  const { token } = useAuthStore();

  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      Alert.alert('Error', 'No authentication token');
      return;
    }

    let cancelled = false; // ✅ cleanup flag

    const fetchSubjects = async () => {
      try {
        // ✅ Fixed: correct endpoint — /subject/all not /admin/all-subjects
        const data = await apiFetch(`${API_URL}/subject/all`, {
          headers: {
            Authorization:  `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!cancelled) setSubjects(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) Alert.alert('Error', error.message || 'Failed to load subjects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSubjects();
    return () => { cancelled = true; };
  }, [token]);

  // ✅ useCallback — stable reference, not recreated on every render
  const renderSubjectItem = useCallback(({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="book-outline" size={24} color={COLORS.primary} />
        <Text style={styles.cardTitle}>{item.subject}</Text>
      </View>

      <View style={styles.creatorsContainer}>
        <Text style={styles.creatorsLabel}>Assigned To:</Text>
        <View style={styles.badgeRow}>
          {item.creators && item.creators.length > 0 ? (
            item.creators.map((creator, index) => {
              const roleColor = ROLE_COLORS[creator.role] ?? ROLE_COLORS['Faculty'];
              return (
                <View
                  key={index}
                  style={[styles.creatorBadge, { backgroundColor: roleColor.bg }]}
                >
                  <Text style={[styles.creatorText, { color: roleColor.text }]}>
                    {creator.name}
                  </Text>
                  <Text style={[styles.creatorRole, { color: roleColor.text }]}>
                    {creator.role}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.noCreators}>No instructor assigned</Text>
          )}
        </View>
      </View>
    </View>
  ), []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading subjects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ Fixed: header uses column layout so subtitle stacks under title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subjects</Text>
        <Text style={styles.headerSubtitle}>
          {subjects.length} subject{subjects.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      <FlatList
        data={subjects}
        renderItem={renderSubjectItem}
        // ✅ Fixed: uses stable _id instead of fragile title + index
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No subjects found</Text>
            {/* ✅ Fixed: static message — condition was always true before */}
            <Text style={styles.emptySubtext}>
              Add subjects via the Dashboard to get started
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: COLORS.background },
  centered:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:       { marginTop: 10, color: COLORS.textSecondary, fontSize: 16 },
  // ✅ Fixed: flexDirection column so subtitle stacks under title
  header:            { backgroundColor: COLORS.primary, padding: 20, paddingTop: 40, flexDirection: 'column' },
  headerTitle:       { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  headerSubtitle:    { fontSize: 14, color: COLORS.white, opacity: 0.8, marginTop: 2 },
  listContainer:     { padding: 15, flexGrow: 1 },
  card:              { backgroundColor: COLORS.white, borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  cardHeader:        { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle:         { fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginLeft: 10, flex: 1 },
  creatorsContainer: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  creatorsLabel:     { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  badgeRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  creatorBadge:      { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15, marginBottom: 4 },
  creatorText:       { fontSize: 12, fontWeight: '600' },
  creatorRole:       { fontSize: 10, marginTop: 1, opacity: 0.8 },
  noCreators:        { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },
  emptyContainer:    { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText:         { fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginTop: 15 },
  emptySubtext:      { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 10 },
});