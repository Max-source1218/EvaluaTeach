import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import TabulationResults from '../../components/TabulationResults';

export default function FacultyTabulationResults() {
  const { facultyId, facultyName, department, schoolyear, semester } = useLocalSearchParams();
  const { token } = useAuthStore();

  return (
    <TabulationResults
      fetchUrl={`${API_URL}/faculty-results/tabulated/${facultyId}/${schoolyear}`}
      token={token}
      headerTitle="Tabulated Results"
      schoolyear={schoolyear}
      semester={semester}
      infoRows={[
        { label: 'Faculty:',    value: facultyName },
        { label: 'Department:', value: department  },
      ]}
      poolBKey="chair"
      poolBLabel="PC & Supervisor (40%)"
    />
  );
}