import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import DrillDownList from '../../components/DrillDownList';

export default function FacultySchoolYear() {
  const { facultyId } = useLocalSearchParams(); // ✅ facultyDept dropped
  const { token } = useAuthStore();

  return (
    <DrillDownList config={{
      token,
      fetchUrl: `${API_URL}/admin/faculty-results/school-years/${facultyId}`,
      headerTitle: 'Select School Year',
      headerSubtitle: 'Faculty Evaluation Results',
      infoLabel: null, // ✅ No info bar needed here
      emptyIcon: 'calendar-outline',
      emptyText: 'No school years found. This faculty has no evaluation records yet.',
      getItemIcon: () => 'calendar-outline',
      getItemSubtitle: () => 'View evaluation results',
      onItemPress: (item, router) => router.push({
        pathname: '/FacultyDepartments',
        params: { facultyId, schoolyear: item },
      }),
    }} />
  );
}