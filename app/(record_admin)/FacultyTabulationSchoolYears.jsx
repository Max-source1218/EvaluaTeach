import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import TabulationSchoolYears from '../../components/TabulationSchoolYears';

export default function FacultyTabulationSchoolYears() {
  const { facultyId, facultyName, department } = useLocalSearchParams();
  const { token } = useAuthStore();

  return (
    <TabulationSchoolYears
      fetchUrl={`${API_URL}/faculty-results/schoolyears/${facultyId}`}
      token={token}
      headerTitle="Select School Year"
      headerSubtitle={facultyName}
      // ✅ Since we're already inside (record_admin), use relative name only
      navigateTo="FacultyTabulationSemesters"
      buildParams={(schoolyear) => ({ facultyId, facultyName, department, schoolyear })}
    />
  );
}