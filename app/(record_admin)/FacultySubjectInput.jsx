import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import SubjectInputForm from '../../components/SubjectInputForm';

export default function FacultySubjectInput() {
  const { instructorId } = useLocalSearchParams();
  const { token } = useAuthStore();

  return (
    <SubjectInputForm
      token={token}
      instructorId={instructorId}
      accentColor="#4CAF50"
      headerTitle="Add Subject for Faculty"
      showEmail={true}
    />
  );
}