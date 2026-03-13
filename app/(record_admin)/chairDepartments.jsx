import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import DrillDownList from '../../components/DrillDownList';

export default function ChairDepartments() {
  const { userId, chairDepartment, userType, schoolyear } = useLocalSearchParams();
  const { token } = useAuthStore();

  const getDeptIcon = (dept) => {
    switch (dept) {
      case 'CCIT':  return 'laptop-outline';
      case 'CTE':   return 'school-outline';
      case 'CBAPA': return 'business-outline';
      default:      return 'business-outline';
    }
  };

  return (
    <DrillDownList config={{
      token,
      fetchUrl: `${API_URL}/program-chair-results/departments/${userId}/${schoolyear}`,
      headerTitle: 'Select Department',
      headerSubtitle: schoolyear,
      infoLabel: 'School Year',
      infoValue: schoolyear,
      emptyIcon: 'business-outline',
      emptyText: 'No departments found.',
      getItemIcon: getDeptIcon,
      getItemSubtitle: () => 'Evaluators from this department',
      onItemPress: (item, router) => router.push({
        pathname: '/chairSemesters',
        params: {
          userId,
          chairDepartment,  // ✅ PC's own dept carried through
          userType,
          schoolyear,
          evaluatorDept: item, // ✅ evaluator's dept clearly named
        },
      }),
    }} />
  );
}