import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import EvaluationForm from '../../components/EvaluationForm';

export default function FacultyEvaluationForm() {
  const { schoolyear, semester, department, facultyId, subjectTitle } = useLocalSearchParams();
  const { token, user } = useAuthStore();
  const userId = user?._id;

  return (
    <EvaluationForm config={{
      token,
      userId,
      nameUrl: `${API_URL}/supervisor-detail`,
      headerTitle: 'Faculty Evaluation Form',
      headerSubtitle: subjectTitle || 'No Subject',
      headerInfo: `${department || 'No Department'} | ${schoolyear || 'No Year'} | ${semester || 'No Semester'}`,
      validateParams: () =>
        !!(subjectTitle && semester && schoolyear && facultyId && department && userId),
      buildPayload: (points, name) => ({
        title: subjectTitle,
        semester,
        schoolyear,
        facultyId,
        userId,
        name,
        department,
        points,
      }),
      submitUrl: 'faculty-evaluation',
    }} />
  );
}