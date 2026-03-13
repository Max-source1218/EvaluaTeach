import { useLocalSearchParams } from 'expo-router';  // ✅ this was missing!
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import TabulationSemesters from '../../components/TabulationSemesters';

export default function FacultyTabulationSemesters() {
  const { facultyId, facultyName, department, schoolyear } = useLocalSearchParams();
  const { token } = useAuthStore();

  return (
    <TabulationSemesters
      fetchUrl={`${API_URL}/faculty-results/semesters/${facultyId}/${schoolyear}`}
      token={token}
      headerTitle="Select Semester"
      headerSubtitle={`${facultyName} — ${schoolyear}`}
      navigateTo="FacultyTabulationResults"
      buildParams={(semester) => ({ facultyId, facultyName, department, schoolyear, semester })}
    />
  );
}