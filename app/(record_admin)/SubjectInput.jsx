import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import SubjectInputForm from '../../components/SubjectInputForm';

export default function SubjectInput() {
  const { instructorId } = useLocalSearchParams();
  const { token } = useAuthStore();

  return (
    <SubjectInputForm
      token={token}
      instructorId={instructorId}
      accentColor="#4A90E2"
      headerTitle="Add Subject"
      showEmail={false}
    />
  );
}