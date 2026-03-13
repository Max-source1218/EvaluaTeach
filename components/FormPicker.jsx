// components/FormPicker.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function FormPicker({ label, selectedValue, onValueChange, items, placeholder }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={styles.picker}
          dropdownIconColor="#4A90E2"
          mode="dropdown"
        >
          <Picker.Item label={placeholder || `Select ${label}`} value="" />
          {items.map((item) => {
            // Supports both plain strings and { label, value } objects
            const val = typeof item === 'string' ? item : item.value;
            const lbl = typeof item === 'string' ? item : item.label;
            return <Picker.Item key={val} label={lbl} value={val} />;
          })}
        </Picker>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 20, color: '#333', marginBottom: 8, fontWeight: '600' },
  pickerWrapper: {
    backgroundColor: '#fff', borderRadius: 8, marginBottom: 20, elevation: 2,
  },
  picker: { color: '#333', height: 25 },
});