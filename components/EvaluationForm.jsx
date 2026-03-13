import { View, Text, Alert, ScrollView, Pressable,
  StyleSheet, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiFetch } from '../lib/apiFetch';
import { API_URL } from '../constants/api';

import CommitmentSection, { initialCommitmentData } from '../app/(tabs_student)/CommitmentSection';
import KnowledgeSection,  { initialKnowledgeData }  from '../app/(tabs_student)/KnowledgeSection';
import SkillsSection,     { initialSkillsData }     from '../app/(tabs_student)/IndependentSection';
import PlanningSection,   { initialPlanningData }   from '../app/(tabs_student)/ManagementSection';

// ─────────────────────────────────────────────────────────
// config shape:
// {
//   token: string,
//   userId: string,
//   headerTitle: string,
//   headerSubtitle: string,       e.g. subjectTitle
//   headerInfo: string,           e.g. "CCIT | 2024-2025 | 1st Semester"
//   headerEvaluator?: string,     optional evaluator name line
//   nameUrl: string,              API URL to fetch evaluator/student name
//   buildPayload: (points, name) => object,
//   submitUrl: string,
//   validateParams: () => boolean,
// }
// ─────────────────────────────────────────────────────────

export default function EvaluationForm({ config }) {
  const router = useRouter();

  const [name, setName]           = useState('Unknown');
  const [loading, setLoading]     = useState(false);
  const [commitment, setCommitment] = useState(initialCommitmentData);
  const [knowledge, setKnowledge]   = useState(initialKnowledgeData);
  const [skills, setSkills]         = useState(initialSkillsData);
  const [planning, setPlanning]     = useState(initialPlanningData);

  // ✅ Fetch evaluator/student name on mount
  useEffect(() => {
    if (!config?.token || !config?.nameUrl) return;

    let cancelled = false;

    const fetchName = async () => {
      try {
        const data = await apiFetch(config.nameUrl, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!cancelled) setName(data.name || 'Unknown');
      } catch {
        if (!cancelled) setName('Unknown');
      }
    };

    fetchName();
    return () => { cancelled = true; };
  }, [config?.token, config?.nameUrl]);

  // ✅ Dynamic question count — no hardcoded / 20
  const computePoints = useCallback(() => {
    const ratingOf = (item) =>
      item.Outstanding ? 5
      : item.Very_Satisfactory ? 4
      : item.Satisfactory ? 3
      : item.Fair ? 2
      : item.Poor ? 1
      : 0;

    const allRatings = [
      ...commitment.map(ratingOf),
      ...knowledge.map(ratingOf),   // ✅ Fixed: was using 'c' instead of 'k'
      ...skills.map(ratingOf),
      ...planning.map(ratingOf),
    ];

    const total = allRatings.length;
    if (total === 0) return 0;

    const sum = allRatings.reduce((acc, r) => acc + r, 0);
    return sum / total; // ✅ Dynamic — works even if question count changes
  }, [commitment, knowledge, skills, planning]);

  const handleSubmit = async () => {
    if (!config.validateParams()) {
      Alert.alert('Error', 'Missing required information. Please go back and try again.');
      return;
    }

    const points = computePoints();
    if (points === 0) {
      Alert.alert('Error', 'Please answer all questions before submitting.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch(`${API_URL}/${config.submitUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.token}`,
        },
        body: JSON.stringify(config.buildPayload(points, name)),
      });

      Alert.alert('Success', 'Evaluation submitted successfully!', [
        { text: 'OK', onPress: () => router.push('/Submitted') }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true} // ✅ Reduces memory on long forms
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{config.headerTitle}</Text>
          <Text style={styles.headerSubtitle}>{config.headerSubtitle}</Text>
          <Text style={styles.headerInfo}>{config.headerInfo}</Text>
          {config.headerEvaluator && (
            <Text style={styles.headerEvaluator}>{config.headerEvaluator}</Text>
          )}
        </View>

        {/* Evaluation Sections */}
        <CommitmentSection commitment={commitment} setCommitment={setCommitment} />
        <KnowledgeSection  knowledge={knowledge}   setKnowledge={setKnowledge} />
        <SkillsSection     skills={skills}         setSkills={setSkills} />
        <PlanningSection   planning={planning}     setPlanning={setPlanning} />

        {/* Submit */}
        <View style={styles.submitButtonContainer}>
          <Pressable
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="white" />
              : <Text style={styles.submitButtonText}>Submit Evaluation Form</Text>
            }
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:             { flex: 1, backgroundColor: 'white' },
  header:                { padding: 20, backgroundColor: '#4A90E2', marginBottom: 10 },
  headerTitle:           { fontSize: 24, fontWeight: 'bold', color: 'white' },
  headerSubtitle:        { fontSize: 18, color: 'white', marginTop: 5 },
  headerInfo:            { fontSize: 14, color: 'white', marginTop: 5, opacity: 0.8 },
  headerEvaluator:       { fontSize: 14, color: 'white', marginTop: 5, fontStyle: 'italic', opacity: 0.9 },
  submitButtonContainer: { padding: 20, alignItems: 'center' },
  submitButton:          { backgroundColor: '#007bff', paddingVertical: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  submitButtonDisabled:  { backgroundColor: '#a0c4f1' },
  submitButtonText:      { color: 'white', fontSize: 18, fontWeight: 'bold' },
});