import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';

const samplePlanningData = [
  { id: 1, title: "5️⃣ Creates opportunities for student contributions.", Outstanding: false, Very_Satisfactory: false, Satisfactory: false, Fair: false, Poor: false },
  { id: 2, title: "4️⃣ Assumes roles as facilitator, coach, inquisitor.", Outstanding: false, Very_Satisfactory: false, Satisfactory: false, Fair: false, Poor: false },
  { id: 3, title: "3️⃣ Designs learning conditions for healthy exchange.", Outstanding: false, Very_Satisfactory: false, Satisfactory: false, Fair: false, Poor: false },
  { id: 4, title: "2️⃣ Structures learning context for objectives.", Outstanding: false, Very_Satisfactory: false, Satisfactory: false, Fair: false, Poor: false },
  { id: 5, title: "1️⃣ Uses instructional materials to reinforce learning.", Outstanding: false, Very_Satisfactory: false, Satisfactory: false, Fair: false, Poor: false },
];

const initialPlanningData = [...samplePlanningData].sort((a, b) => b.id - a.id);

export default function PlanningSection({ planning, setPlanning, onSubmit }) {
  const toggle = (id, rating) => {
    setPlanning((prev) =>
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
        <Text style={styles.headerText}>D. Management Learning</Text>
      </View>
      <FlatList 
        data={planning} 
        renderItem={renderItem} 
        keyExtractor={(item) => `plan-${item.id}`} 
        scrollEnabled={false} 
        ListFooterComponent={onSubmit}
      />
    </View>
  );
}

export { initialPlanningData };

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