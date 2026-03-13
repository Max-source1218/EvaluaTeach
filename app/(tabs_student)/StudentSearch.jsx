import SearchScreen from '../../components/SearchScreen';
import { useStudentAuthStore } from '../../store/studentAuthStore';
import { API_URL } from '../../constants/api';

export default function StudentSearch() {
  const { token } = useStudentAuthStore();

  return (
    <SearchScreen config={{
      token,
      fetchUrl: ({ schoolyear, semester, department }) =>
        `${API_URL}/student-detail/evaluators?schoolyear=${schoolyear}&semester=${semester}&department=${department}`,
      extractInstructors: (data) => [...(data.faculty || []), ...(data.programChairs || [])],
      instructorLabel: 'Evaluator',
      navigateTo: '/StudentEvaluationForm',
      buildParams: (base, inst, subj) => ({
        ...base,
        evaluatorId: inst._id,
        evaluatorType: inst.type,
        evaluatorName: inst.name,
        subjectTitle: subj.title,
      }),
    }} />
  );
}