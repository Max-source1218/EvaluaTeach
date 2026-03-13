import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import DrillDownList from '../../components/DrillDownList';

export default function ChairSemesters() {
  const { userId, chairDepartment, userType, schoolyear, evaluatorDept } = useLocalSearchParams();
  const { token } = useAuthStore();

  return (
    <DrillDownList config={{
      token,
      fetchUrl: `${API_URL}/program-chair-results/semesters/${userId}/${schoolyear}/${evaluatorDept}`,
      headerTitle: 'Select Semester',
      headerSubtitle: `${schoolyear} — ${evaluatorDept}`,
      infoLabel: 'Evaluator Department',
      infoValue: evaluatorDept,
      emptyIcon: 'time-outline',
      emptyText: 'No semesters found.',
      getItemIcon: () => 'time-outline',
      onItemPress: (item, router) => router.push({
        pathname: '/chairSubjects',
        params: {
          userId,
          chairDepartment,
          userType,
          schoolyear,
          evaluatorDept,
          semester: item,
        },
      }),
    }} />
  );
}