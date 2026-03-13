import SearchScreen from '../../components/SearchScreen';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';

export default function SupervisorSearch() {
  const { token } = useAuthStore();

  return (
    <SearchScreen config={{
      token,
      fetchUrl: ({ schoolyear, semester, department }) =>
        `${API_URL}/subject/filter?schoolyear=${schoolyear}&semester=${semester}&department=${department}&type=programchair`,
      extractInstructors: (data) => data.instructors,
      instructorLabel: 'Program Chair',
      navigateTo: '/SupervisorEvaluationForm',
      buildParams: (base, inst, subj) => ({
        ...base,
        instructorId: inst._id,
        subjectTitle: subj.title,
        evaluationType: 'supervisor',
      }),
    }} />
  );
}