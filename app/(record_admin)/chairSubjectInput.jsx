import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';

const COLORS = {
  primary: "#4CAF50",
  textPrimary: "#2e5a2e",
  textSecondary: "#688f68",
  textDark: "#1b361b",
  placeholderText: "#767676",
  background: "#e8f5e9",
  cardBackground: "#f1f8f2",
  inputBackground: "#f4faf5",
  border: "#c8e6c9",
  white: "#ffffff",
  black: "#000000",
};

const ChairSubjectInput = () => {
  const { instructorId, department } = useLocalSearchParams();
  const { token } = useAuthStore();
  const router = useRouter();
  
  const [schoolYears, setSchoolYears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchoolYears = async () => {
      try {
        console.log('=== FETCHING SCHOOL YEARS ===');
        
        const response = await fetch(`${API_URL}/program-chair-results/schoolyears/${instructorId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const text = await response.text();
        
        if (text.trim().startsWith('<') || response.status === 404) {
          throw new Error('Failed to fetch school years');
        }

        const data = JSON.parse(text);
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch');
        }

        setSchoolYears(data);
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', error.message || 'Failed to load school years');
      } finally {
        setLoading(false);
      }
    };

    if (instructorId && token) {
      fetchSchoolYears();
    }
  }, [instructorId, token]);

  const renderSchoolYearItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        router.push({
          pathname: '/chairDepartments',
          params: { 
            instructorId,
            schoolyear: item.schoolyear,
          }
        });
      }}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
        <Text style={styles.cardTitle}>{item.schoolyear}</Text>
      </View>
      <Text style={styles.cardSubtitle}>{item.count} subject(s) evaluated</Text>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} style={styles.chevron} />
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={60} color={COLORS.border} />
      <Text style={styles.emptyText}>No school years found</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
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
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Select School Year</Text>
          <Text style={styles.headerSubtitle}>Program Chair Evaluation Results</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>Program Chair Department:</Text>
        <Text style={styles.infoValue}>{department}</Text>
      </View>

      <FlatList
        data={schoolYears}
        renderItem={renderSchoolYearItem}
        keyExtractor={(item) => item.schoolyear}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.textSecondary, fontSize: 16 },
  header: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 40, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  headerSubtitle: { fontSize: 14, color: COLORS.white, opacity: 0.8, marginTop: 2 },
  infoContainer: { backgroundColor: COLORS.white, padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary },
  infoValue: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '600', marginTop: 2 },
  listContainer: { padding: 15, flexGrow: 1 },
  card: { backgroundColor: COLORS.cardBackground, borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginLeft: 10 },
  cardSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 5, marginLeft: 34 },
  chevron: { position: 'absolute', right: 0, top: 15 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.textDark, marginTop: 15 },
});

export default ChairSubjectInput;