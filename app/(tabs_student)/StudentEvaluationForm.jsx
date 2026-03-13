import { useLocalSearchParams } from 'expo-router';
import { useStudentAuthStore } from '../../store/studentAuthStore';
import { API_URL } from '../../constants/api';
import EvaluationForm from '../../components/EvaluationForm';

export default function StudentEvaluationForm() {
  const {
    schoolyear, semester, department,
    evaluatorId, evaluatorType, evaluatorName, subjectTitle,
  } = useLocalSearchParams();

  const { token, student } = useStudentAuthStore();
  const studentId = student?._id;

  return (
    <EvaluationForm config={{
      token,
      userId: studentId,
      nameUrl: `${API_URL}/student-detail/user`,
      headerTitle: `${evaluatorType === 'programchair' ? 'Program Chair' : 'Faculty'} Evaluation`,
      headerSubtitle: subjectTitle,
      headerInfo: `${department} | ${schoolyear} | ${semester}`,
      headerEvaluator: `Evaluating: ${evaluatorName}`,
      validateParams: () =>
        !!(subjectTitle && semester && schoolyear && evaluatorId && department && studentId),
      buildPayload: (points, name) => ({
        title: subjectTitle,
        semester,
        schoolyear,
        department,
        evaluatorId,
        evaluatorType: 'Student',
        studentId,
        points,
        name,
      }),
      submitUrl: 'student-evaluation',
    }} />
  );
}