import { useState, useEffect, memo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../lib/apiFetch';
import COLORS from '../constants/resultColors';

const getRatingColor = (rating) => {
  if (rating >= 4.5) return '#28a745';
  if (rating >= 3.5) return '#17a2b8';
  if (rating >= 2.5) return '#ffc107';
  if (rating >= 1.5) return '#fd7e14';
  return '#dc3545';
};

const fmt = (val) => (val ?? 0).toFixed(2);

const LEGEND = [
  { color: '#28a745', label: '4.5 – 5.0: Outstanding' },
  { color: '#17a2b8', label: '3.5 – 4.49: Very Satisfactory' },
  { color: '#ffc107', label: '2.5 – 3.49: Satisfactory' },
  { color: '#fd7e14', label: '1.5 – 2.49: Fair' },
  { color: '#dc3545', label: 'Below 1.5: Poor' },
];

const Row = memo(({ label, value, color, bold }) => (
  <View style={styles.row}>
    <Text style={[styles.label, bold && styles.labelBold]}>{label}</Text>
    <Text style={[styles.value, { color }, bold && styles.valueBold]}>{value}</Text>
  </View>
));

const ResultCard = memo(({ result, poolBKey, poolBLabel, isHighlighted }) => {
  const poolB        = result[poolBKey] ?? {};
  const studentColor = getRatingColor(result.student?.rating ?? 0);
  const poolBColor   = getRatingColor(poolB.rating ?? 0);
  const totalColor   = getRatingColor(result.total?.rating ?? 0);

  return (
    // ✅ Highlighted card gets a gold border + light gold background
    <View style={[
      styles.resultCard,
      isHighlighted && styles.resultCardHighlighted,
    ]}>
      <View style={[
        styles.resultHeader,
        isHighlighted && styles.resultHeaderHighlighted,
      ]}>
        <View style={styles.resultHeaderRow}>
          <Text style={styles.resultHeaderText}>Semester: {result.semester}</Text>
          {/* ✅ Badge shown only on selected semester */}
          {isHighlighted && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>Selected</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👨‍🎓 Students (60%)</Text>
        <Row label="C. Rating"     value={fmt(result.student?.rating)}   color={studentColor} />
        <Row label="D. Score"      value={fmt(result.student?.score)}    color={studentColor} />
        <Row label="E. Score 60%"  value={fmt(result.student?.score60)}  color={studentColor} />
        <Row label="F. Rating 60%" value={fmt(result.student?.rating60)} color={studentColor} />
        <Row label="Evaluations"   value={result.student?.count ?? 0}    color={COLORS.textSecondary} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🪑 {poolBLabel}</Text>
        <Row label="G. Rating"     value={fmt(poolB.rating)}   color={poolBColor} />
        <Row label="H. Score"      value={fmt(poolB.score)}    color={poolBColor} />
        <Row label="I. Rating 40%" value={fmt(poolB.rating40)} color={poolBColor} />
        <Row label="J. Score 40%"  value={fmt(poolB.score40)}  color={poolBColor} />
        <Row label="Evaluations"   value={poolB.count ?? 0}    color={COLORS.textSecondary} />
      </View>

      <View style={[styles.section, styles.totalSection]}>
        <Text style={styles.sectionTitle}>📊 Total</Text>
        <Row label="Score (Score 60% + Score 40%)"  value={fmt(result.total?.score)}  color={totalColor} bold />
        <Row label="Rating (Rating 60% + Rating 40%)" value={fmt(result.total?.rating)} color={totalColor} bold />
      </View>
    </View>
  );
});

/**
 * Props:
 *   fetchUrl    string   — /faculty-results/tabulated/:id/:year
 *   token       string
 *   schoolyear  string
 *   semester    string   — selected semester to highlight
 *   infoRows    array    — [{ label, value }]
 *   poolBKey    string   — 'chair' | 'supervisor'
 *   poolBLabel  string   — "PC & Supervisor (40%)" | "Supervisor (40%)"
 */
export default function TabulationResults({
  fetchUrl,
  token,
  headerTitle = 'Tabulated Results',
  schoolyear,
  semester,
  infoRows = [],
  poolBKey,
  poolBLabel,
}) {
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!fetchUrl || !token) {
      setError('Missing required parameters.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchResults = async () => {
      try {
        const data = await apiFetch(fetchUrl, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!cancelled) {
          setResults(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          Alert.alert('Error', err.message || 'Failed to load results');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchResults();
    return () => { cancelled = true; };
  }, [fetchUrl, token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  if (error && results.length === 0) {
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
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Text style={styles.headerSubtitle}>{schoolyear}</Text>
        </View>
      </View>

      {infoRows.length > 0 && (
        <View style={styles.infoContainer}>
          {infoRows.map(({ label, value }) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
          {/* ✅ Show which semester is highlighted in the info panel */}
          {semester && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Semester:</Text>
              <Text style={[styles.infoValue, styles.infoValueHighlight]}>{semester}</Text>
            </View>
          )}
        </View>
      )}

      {results.length > 0 ? (
        <ScrollView style={styles.scrollContainer} removeClippedSubviews={true}>
          {results.map((result) => (
            <ResultCard
              key={result.semester}
              result={result}
              poolBKey={poolBKey}
              poolBLabel={poolBLabel}
              // ✅ Highlight the card that matches the selected semester
              isHighlighted={result.semester === semester}
            />
          ))}

          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Rating Scale:</Text>
            {LEGEND.map(({ color, label }) => (
              <View key={label} style={styles.legendRow}>
                <View style={[styles.legendBadge, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={60} color={COLORS.border} />
          <Text style={styles.emptyText}>No evaluation results found</Text>
          <Text style={styles.emptySubtext}>
            No evaluations have been submitted for {schoolyear}.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:                { flex: 1, backgroundColor: COLORS.background },
  centered:                 { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText:              { marginTop: 10, color: COLORS.textSecondary, fontSize: 16 },
  errorText:                { fontSize: 16, color: '#dc3545', textAlign: 'center', marginVertical: 20 },
  backBtn:                  { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, marginTop: 10 },
  backBtnText:              { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  header:                   { backgroundColor: COLORS.primary, padding: 20, paddingTop: 40, flexDirection: 'row', alignItems: 'center' },
  backButton:               { marginRight: 15 },
  headerText:               { flex: 1 },
  headerTitle:              { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  headerSubtitle:           { fontSize: 14, color: COLORS.white, opacity: 0.8, marginTop: 2 },
  infoContainer:            { backgroundColor: COLORS.white, padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoRow:                  { flexDirection: 'row', marginBottom: 5 },
  infoLabel:                { fontSize: 14, color: COLORS.textSecondary, width: 120 },
  infoValue:                { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  infoValueHighlight:       { color: '#b8860b', fontWeight: '700' },
  scrollContainer:          { padding: 15 },
  resultCard:               { backgroundColor: COLORS.white, borderRadius: 12, marginBottom: 15, overflow: 'hidden', elevation: 2, borderWidth: 1, borderColor: 'transparent' },
  // ✅ Gold border + soft gold background for selected semester
  resultCardHighlighted:    { borderColor: '#f0c040', borderWidth: 2, backgroundColor: '#fffdf0' },
  resultHeader:             { backgroundColor: COLORS.primary, padding: 12 },
  // ✅ Darker gold header for selected semester
  resultHeaderHighlighted:  { backgroundColor: '#b8860b' },
  resultHeaderRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultHeaderText:         { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  selectedBadge:            { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  selectedBadgeText:        { color: '#b8860b', fontSize: 11, fontWeight: '700' },
  section:                  { padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionTitle:             { fontSize: 14, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10 },
  totalSection:             { backgroundColor: COLORS.cardBackground },
  row:                      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label:                    { fontSize: 14, color: COLORS.textSecondary, flex: 1 },
  labelBold:                { fontWeight: '600', color: COLORS.textDark },
  value:                    { fontSize: 16, fontWeight: '600' },
  valueBold:                { fontSize: 18, fontWeight: 'bold' },
  legendContainer:          { backgroundColor: COLORS.white, borderRadius: 12, padding: 15, marginBottom: 20 },
  legendTitle:              { fontSize: 14, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 10 },
  legendRow:                { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendBadge:              { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText:               { fontSize: 12, color: COLORS.textSecondary },
  emptyContainer:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText:                { fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginTop: 15 },
  emptySubtext:             { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
});