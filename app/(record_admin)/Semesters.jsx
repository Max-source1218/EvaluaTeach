import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import { useState, useEffect } from 'react';

const EvaluationSemesters = () => {
  const { instructorId, schoolyear } = useLocalSearchParams();
  const { token } = useAuthStore();
  const router = useRouter();
  const [semesterList, setSemesterList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const response = await fetch(`${API_URL}/evaluation/semesters/${instructorId}/${schoolyear}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setSemesterList(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to load semesters');
      } finally {
        setLoading(false);
      }
    };
    fetchSemesters();
  }, [instructorId, schoolyear]);

  const renderSemester = ({ item }) => (
    <TouchableOpacity 
      style={styles.semesterCard} 
      onPress={() => router.push({ 
        pathname: '/EvaluationSubjects', 
        params: { instructorId, schoolyear, semester: item } 
      })}
    >
      <Text style={styles.semesterText}>{item}</Text>
    </TouchableOpacity>
  );

  if (loading) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>{schoolyear} Semesters</Text>
      </View>
      <FlatList
        data={semesterList}
        renderItem={renderSemester}
        keyExtractor={(item) => item}
        ListEmptyComponent={<Text>No semesters found for this school year</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold',
    marginLeft: 10 
  },
  semesterCard: { 
    backgroundColor: '#f9f9f9',
    padding: 15, 
    marginBottom: 10, 
    borderRadius: 8 
  },
  semesterText: { 
    fontSize: 16 
  },
});

export default EvaluationSemesters;