import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import TabulationSemesters from '../../components/TabulationSemesters'; // ✅ correct component

export default function ChairTabulationSemesters() {
  const { programChairId, programChairName, department, schoolyear } = useLocalSearchParams();
  const { token } = useAuthStore();

  return (
    <TabulationSemesters
      fetchUrl={`${API_URL}/program-chair-results/semesters/${programChairId}/${schoolyear}`}
      token={token}
      headerTitle="Select Semester"
      headerSubtitle={`${programChairName} — ${schoolyear}`}
      navigateTo="ChairTabulationResults"
      buildParams={(semester) => ({ programChairId, programChairName, department, schoolyear, semester })}
    />
  );
}