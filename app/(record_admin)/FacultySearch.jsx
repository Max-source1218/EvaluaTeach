import SearchScreen from '../../components/SearchScreen';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';

export default function FacultySearch() {
  const { token } = useAuthStore();

  return (
    <SearchScreen config={{
      token,
      fetchUrl: ({ schoolyear, semester, department }) =>
        `${API_URL}/subject/filter?schoolyear=${schoolyear}&semester=${semester}&department=${department}&type=faculty`,
      extractInstructors: (data) => data.instructors,
      instructorLabel: 'Faculty',
      navigateTo: '/FacultyEvaluationForm',
      buildParams: (base, inst, subj) => ({
        ...base,
        facultyId: inst._id,
        subjectTitle: subj.title,
      }),
    }} />
  );
}