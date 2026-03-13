// assets/styles/subjectInput.styles.js
import { StyleSheet } from 'react-native';
import COLORS from '../../constants/colors'; // Adjust path if needed

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text || '#000',
    marginLeft: 10,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text || '#000',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border || '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: COLORS.white || '#fff',
  },
  button: {
    backgroundColor: COLORS.primary || '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: COLORS.white || '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default styles;