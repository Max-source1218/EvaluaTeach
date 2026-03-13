import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import EvaluationForm from '../../components/EvaluationForm';

export default function SupervisorEvaluationForm() {
  const {
    schoolyear, semester, department,
    instructorId, subjectTitle,
  } = useLocalSearchParams();

  const { token, user } = useAuthStore();
  const userId = user?._id;

  return (
    <EvaluationForm config={{
      token,
      userId,
      nameUrl: `${API_URL}/supervisor-detail`,
      headerTitle: 'Program Chair Evaluation',
      headerSubtitle: subjectTitle || 'No Subject',
      headerInfo: `${department || 'No Department'} | ${schoolyear || 'No Year'} | ${semester || 'No Semester'}`,
      validateParams: () =>
        !!(subjectTitle && semester && schoolyear && instructorId && department && userId),
      buildPayload: (points, name) => ({
        title: subjectTitle,
        semester,
        schoolyear,
        department,
        instructorId,
        userId,
        name,
        points,
      }),
      submitUrl: 'supervisor-evaluation',
    }} />
  );
}