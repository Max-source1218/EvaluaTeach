import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';

const sampleCommitmentData = [
  { id: 1, title: "5️⃣ Demonstrate sensitivity to student's ability to attend and absorb content information.", Outstanding: false, Very_Satisfactory: false, Satisfactory: false, Fair: false, Poor: false },
  { id: 2, title: "4️⃣ Integrates sensitivity to his/her learning objectives with those of the students in a collaborative process.", Outstanding: false, Very_Satisfactory: false, Satisfactory: false, Fair: false, Poor: false },
  { id: 3, title: "3️⃣ Makes self available to students beyond official time.", Outstanding: false, Very_Satisfactory: false, Satisfactory: false, Fair: false, Poor: false },
  { id: 4, title: "2️⃣ Regularly comes to class on time, well-groomed and well-prepared to complete assigned responsibilities.", Outstanding: false, Very_Satisfactory: false, Satisfactory: false, Fair: false, Poor: false },
  { id: 5, title: "1️⃣ Keeps accurate record of student's performance and prompt submission of the same.", Outstanding: false, Very_Satisfactory: false, Satisfactory: false, Fair: false, Poor: false },
];

const initialCommitmentData = [...sampleCommitmentData].sort((a, b) => b.id - a.id);

export default function CommitmentSection({ commitment, setCommitment }) {
  const toggle = (id, rating) => {
    setCommitment((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, Outstanding: rating === 'Outstanding', Very_Satisfactory: rating === 'Very_Satisfactory', Satisfactory: rating === 'Satisfactory', Fair: rating === 'Fair', Poor: rating === 'Poor' }
          : item
      )
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <View style={styles.ratingContainer}>
        <Pressable style={[styles.ratingBtn, item.Outstanding && styles.selectedRating]} onPress={() => toggle(item.id, 'Outstanding')}>
          <Text style={styles.ratingText}>5</Text>
        </Pressable>
        <Pressable style={[styles.ratingBtn, item.Very_Satisfactory && styles.selectedRating]} onPress={() => toggle(item.id, 'Very_Satisfactory')}>
          <Text style={styles.ratingText}>4</Text>
        </Pressable>
        <Pressable style={[styles.ratingBtn, item.Satisfactory && styles.selectedRating]} onPress={() => toggle(item.id, 'Satisfactory')}>
          <Text style={styles.ratingText}>3</Text>
        </Pressable>
        <Pressable style={[styles.ratingBtn, item.Fair && styles.selectedRating]} onPress={() => toggle(item.id, 'Fair')}>
          <Text style={styles.ratingText}>2</Text>
        </Pressable>
        <Pressable style={[styles.ratingBtn, item.Poor && styles.selectedRating]} onPress={() => toggle(item.id, 'Poor')}>
          <Text style={styles.ratingText}>1</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>A. Commitment</Text>
      </View>
      <FlatList data={commitment} renderItem={renderItem} keyExtractor={(item) => `commit-${item.id}`} scrollEnabled={false} />
    </View>
  );
}

export { initialCommitmentData };

const styles = StyleSheet.create({
  headerContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f8f9fa' },
  headerText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  item: { backgroundColor: '#fff', padding: 16, marginBottom: 10, marginHorizontal: 16, borderRadius: 8, elevation: 2 },
  itemTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  ratingContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  ratingBtn: { backgroundColor: '#e9ecef', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, marginRight: 8, marginBottom: 4 },
  selectedRating: { backgroundColor: '#007bff' },
  ratingText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
});