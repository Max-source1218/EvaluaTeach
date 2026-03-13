import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import TabulationResults from '../../components/TabulationResults';

export default function ChairTabulationResults() {
  const { programChairId, programChairName, department, schoolyear, semester } = useLocalSearchParams();
  const { token } = useAuthStore();

  return (
    <TabulationResults
      fetchUrl={`${API_URL}/program-chair-results/tabulated/${programChairId}/${schoolyear}`}
      token={token}
      headerTitle="Tabulated Results"
      schoolyear={schoolyear}
      semester={semester}
      infoRows={[
        { label: 'Program Chair:', value: programChairName },
        { label: 'Department:',    value: department       },
      ]}
      poolBKey="supervisor"
      poolBLabel="Supervisor (40%)"
    />
  );
}
