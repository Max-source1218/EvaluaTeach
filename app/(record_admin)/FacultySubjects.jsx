import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import DrillDownList from '../../components/DrillDownList';

export default function FacultySubjects() {
  const { facultyId, schoolyear, department, semester } = useLocalSearchParams();
  const { token } = useAuthStore();

  return (
    <DrillDownList config={{
      token,
      fetchUrl: `${API_URL}/admin/faculty-results/subjects/${facultyId}/${schoolyear}/${department}/${semester}`,
      headerTitle: 'Select Subject',
      headerSubtitle: `${schoolyear} — ${semester}`,
      infoLabel: 'Department',
      infoValue: department,
      emptyIcon: 'book-outline',
      emptyText: 'No subjects found.',
      getItemIcon: () => 'book-outline',
      onItemPress: (item, router) => router.push({
        pathname: '/FacultyEvaluationResults',
        params: { facultyId, schoolyear, department, semester, subject: item },
      }),
    }} />
  );
}