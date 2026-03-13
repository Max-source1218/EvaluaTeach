// components/AppSidebar.jsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const SIDEBAR_WIDTH = 250;

export default function AppSidebar({ visible, onClose, onLogout }) {
  return (
    <>

      {visible && (
        <Pressable style={styles.backdrop} onPress={onClose} />
      )}

      <View style={[styles.sidebar, visible ? styles.visible : styles.hidden]}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Menu</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <Pressable style={styles.item} onPress={onLogout}>
          <Text style={styles.itemText}>⭕ Logout</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 0,
  },
  sidebar: {
    width: SIDEBAR_WIDTH, backgroundColor: 'white', elevation: 5,
    position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 1,
  },
  visible: { transform: [{ translateX: 0 }] },
  hidden:  { transform: [{ translateX: -SIDEBAR_WIDTH }] },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 20, paddingHorizontal: 15,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  closeBtn: { padding: 5 },
  closeBtnText: { fontSize: 20, color: '#666' },
  item: {
    paddingVertical: 15, paddingHorizontal: 15,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  itemText: { fontSize: 16, color: '#333' },
});