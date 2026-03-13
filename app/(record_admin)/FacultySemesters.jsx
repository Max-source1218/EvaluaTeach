import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import DrillDownList from '../../components/DrillDownList';

export default function FacultySemesters() {
  const { facultyId, schoolyear, department } = useLocalSearchParams();
  const { token } = useAuthStore();

  return (
    <DrillDownList config={{
      token,
      fetchUrl: `${API_URL}/admin/faculty-results/semesters/${facultyId}/${schoolyear}/${department}`,
      headerTitle: 'Select Semester',
      headerSubtitle: `${schoolyear} — ${department}`,
      infoLabel: 'Department',
      infoValue: department,
      emptyIcon: 'time-outline',
      emptyText: 'No semesters found.',
      getItemIcon: () => 'time-outline',
      onItemPress: (item, router) => router.push({
        pathname: '/FacultySubjects',
        params: { facultyId, schoolyear, department, semester: item },
      }),
    }} />
  );
}