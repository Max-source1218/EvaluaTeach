import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import TabulationSchoolYears from '../../components/TabulationSchoolYears';

export default function ChairTabulationSchoolYears() {
  const { programChairId, programChairName, department } = useLocalSearchParams();
  const { token } = useAuthStore();

  return (
    <TabulationSchoolYears
      fetchUrl={`${API_URL}/program-chair-results/schoolyears/${programChairId}`}
      token={token}
      headerTitle="Select School Year"
      headerSubtitle={programChairName}
      // ✅ Full path including (record_admin) group
      navigateTo="ChairTabulationSemesters"
      buildParams={(schoolyear) => ({ programChairId, programChairName, department, schoolyear })}
    />
  );
}