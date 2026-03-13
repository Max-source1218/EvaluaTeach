// components/DrillDownList.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../lib/apiFetch';
import { API_URL } from '../constants/api';
import COLORS from '../constants/resultColors';

// ─────────────────────────────────────────────────────────
// config shape:
// {
//   token: string,
//   fetchUrl: string,             full URL to fetch
//   headerTitle: string,
//   headerSubtitle: string,
//   infoLabel: string,
//   infoValue: string,
//   emptyText: string,
//   emptyIcon: string,            Ionicons name
//   getItemIcon: (item) => string,
//   getItemSubtitle: (item) => string,
//   onItemPress: (item, router) => void,
//   keyField?: string,            default 'item' (for string arrays)
// }
// ─────────────────────────────────────────────────────────

export default function DrillDownList({ config }) {
  const router = useRouter();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!config?.token || !config?.fetchUrl) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchItems = async () => {
      try {
        const data = await apiFetch(config.fetchUrl, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (cancelled) return;

        // Backend returns string arrays for these drill-downs
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) return;
        Alert.alert('Error', err.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchItems();
    return () => { cancelled = true; };
  }, [config?.fetchUrl, config?.token]);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => config.onItemPress(item, router)}
    >
      <View style={styles.cardHeader}>
        <Ionicons
          name={config.getItemIcon ? config.getItemIcon(item) : 'chevron-forward'}
          size={24}
          color={COLORS.primary}
        />
        <Text style={styles.cardTitle}>{item}</Text>
      </View>
      {config.getItemSubtitle && (
        <Text style={styles.cardSubtitle}>{config.getItemSubtitle(item)}</Text>
      )}
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} style={styles.chevron} />
    </TouchableOpacity>
  ), [config]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
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
          <Text style={styles.headerTitle}>{config.headerTitle}</Text>
          {config.headerSubtitle ? (
            <Text style={styles.headerSubtitle}>{config.headerSubtitle}</Text>
          ) : null}
        </View>
      </View>

      {config.infoLabel && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>{config.infoLabel}</Text>
          <Text style={styles.infoValue}>{config.infoValue}</Text>
        </View>
      )}

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item} // ✅ Safe — these are string arrays
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name={config.emptyIcon || 'document-outline'} size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>{config.emptyText || 'No data found'}</Text>
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
  cardTitle:      { fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginLeft: 10, flex: 1 },
  cardSubtitle:   { fontSize: 14, color: COLORS.textSecondary, marginTop: 5, marginLeft: 34 },
  chevron:        { position: 'absolute', right: 0, top: 15 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText:      { fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginTop: 15 },
});