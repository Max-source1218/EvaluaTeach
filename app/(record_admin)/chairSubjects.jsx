import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import DrillDownList from '../../components/DrillDownList';

export default function ChairSubjects() {
  const { userId, chairDepartment, userType, schoolyear, evaluatorDept, semester } = useLocalSearchParams();
  const { token } = useAuthStore();

  return (
    <DrillDownList config={{
      token,
      fetchUrl: `${API_URL}/program-chair-results/subjects/${userId}/${schoolyear}/${evaluatorDept}/${semester}`,
      headerTitle: 'Select Subject',
      headerSubtitle: `${schoolyear} — ${semester}`,
      infoLabel: 'Evaluator Department',
      infoValue: evaluatorDept,
      emptyIcon: 'book-outline',
      emptyText: 'No subjects found.',
      getItemIcon: () => 'book-outline',
      onItemPress: (item, router) => router.push({
        pathname: '/chairEvaluationResults',
        params: {
          userId,
          chairDepartment,
          userType,
          schoolyear,
          evaluatorDept,
          semester,
          subject: item,
        },
      }),
    }} />
  );
}