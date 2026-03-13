import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constants/colors';
const { width } = Dimensions.get('window');

const Sidebar = ({ isOpen, onClose, menuItems = [] }) => {
  if (!isOpen) return null;


  return (
    <>
      {/* Sidebar */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: width * 0.8, // 70% of screen width
        height: '100%',
        backgroundColor: COLORS.background || '#fff', // Fallback to white
        padding: 20,
        zIndex: 10,
        elevation: 10, // For Android shadow
      }}>
        <TouchableOpacity onPress={onClose} style={{
          alignSelf: 'flex-end',
          marginBottom: 20,
        }}>
          <Ionicons name="close" size={24} color={COLORS.text || '#000'} />
        </TouchableOpacity>
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: COLORS.text || '#000',
          marginBottom: 20,
        }}>Menu</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={{
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.lightGray || '#ccc', // Fallback to light gray
          }} onPress={item.onPress}>
            <Text style={{
              fontSize: 16,
              color: COLORS.text || '#000',
            }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Overlay to close sidebar */}
      <TouchableOpacity style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent black
        zIndex: 5,
      }} onPress={onClose} />
    </>
  );
};

export default Sidebar;