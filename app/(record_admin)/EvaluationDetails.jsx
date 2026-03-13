import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';

const EvaluationDetails = () => {
  const { instructorId, schoolyear, semester, title } = useLocalSearchParams();
  const { token } = useAuthStore();
  const router = useRouter();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const response = await fetch(`${API_URL}/evaluation/details/${instructorId}/${schoolyear}/${semester}/${title}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setEvaluations(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to load evaluations');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluations();
  }, [instructorId, schoolyear, semester, title]);

  const renderEvaluation = ({ item }) => (
  <View style={styles.evaluationCard}>
    <Text style={styles.nameText}>Name: {item.name}</Text>
    <Text style={styles.pointsText}>Points: {item.points}</Text>
  </View>
);

  if (loading) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>{title} Evaluations</Text>
      </View>
      <FlatList
        data={evaluations}
        renderItem={renderEvaluation}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={<Text>No evaluations found</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  evaluationCard: { backgroundColor: '#f9f9f9', padding: 15, marginBottom: 10, borderRadius: 8 },
  nameText: { fontSize: 16, marginBottom: 5 },
  pointsText: { fontSize: 16 },
});

export default EvaluationDetails;