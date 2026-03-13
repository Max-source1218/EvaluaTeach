import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Alert, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from "expo-router";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import { Ionicons } from '@expo/vector-icons';
import { Image } from "expo-image";
import { apiFetch } from '../../lib/apiFetch'; // ✅ shared helper

import COLORS from '../../constants/colors';
import styles from "../../assets/styles/profile.styles";
import ProfileHeader from '../../components/ProfileHeader';
import { sleep } from './Dashboard';
import Loader from '../../components/Loader';

const Profile = () => {
  const [instructors, setInstructors]       = useState([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [deleteInstructorId, setDeleteInstructorId] = useState(null);

  const { token, user, logout } = useAuthStore();
  const router = useRouter();

  // ✅ Derive role booleans once, pass into callbacks to avoid stale closure
  const role          = user?.role;
  const isProgramChair = role === 'Program Chair';
  const isSupervisor   = role === 'Supervisor';

  // ✅ useCallback so fetchData is stable — won't be recreated every render
  const fetchData = useCallback(async () => {
    // ✅ Derive inside the function from current role — no stale closure risk
    const _isProgramChair = user?.role === 'Program Chair';
    const _isSupervisor   = user?.role === 'Supervisor';

    const endpoint = _isProgramChair
      ? `${API_URL}/admin/faculty`
      : _isSupervisor
        ? `${API_URL}/admin/program-chairs`
        : `${API_URL}/instructor/user`;

    try {
      setIsLoading(true);

      const data = await apiFetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mapped = Array.isArray(data)
        ? data.map(item => ({
            _id:        item._id,
            name:       item.username || item.name || 'Unknown',
            department: item.department || 'N/A',
            email:      item.email || 'N/A',
            image:      item.profileImage || item.image || null,
            type:       _isProgramChair ? 'Faculty'
                      : _isSupervisor   ? 'Program Chair'
                      : 'Instructor',
          }))
        : [];

      setInstructors(mapped);
    } catch (err) {
      Alert.alert("Error", `Failed to load profile data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [token, user?.role]); // ✅ both token and role as dependencies

  useEffect(() => {
    fetchData();
  }, [fetchData]); // ✅ fetchData is stable via useCallback

  const handleDeleteInstructor = async (instructorId) => {
    const endpoint = isProgramChair
      ? `${API_URL}/faculty/${instructorId}`
      : isSupervisor
        ? `${API_URL}/admin/users/${instructorId}`
        : `${API_URL}/instructor/${instructorId}`;

    const deletedType = isProgramChair ? 'Faculty'
                      : isSupervisor   ? 'Program Chair'
                      : 'Instructor';

    try {
      setDeleteInstructorId(instructorId);

      await apiFetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Functional update — never reads stale instructors snapshot
      setInstructors(prev => prev.filter(i => i._id !== instructorId));
      Alert.alert("Success", `${deletedType} deleted successfully`);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to delete");
    } finally {
      setDeleteInstructorId(null);
    }
  };

  const confirmDelete = (instructorId, name) => {
    const userType = isProgramChair ? 'Faculty' : 'Program Chair';
    Alert.alert(
      `Delete ${userType}`,
      `Are you sure you want to remove ${name} from the list?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleDeleteInstructor(instructorId) },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/"); // ✅ routes to index.jsx
        },
      },
    ]);
  };

  // Only this block changes — rest of Profile.jsx stays the same
const handleNavigate = (item) => {
  if (isProgramChair) {
    router.push({
      pathname: '/FacultySchoolYear',
      params: {
        facultyId: item._id,
        department: item.department,
      },
    });
  } else if (isSupervisor) {
    router.push({
      pathname: '/ChairSchoolYear',
      params: {
        userId: item._id,
        chairDepartment: item.department, // ✅ renamed from department
        userType: 'Supervisor',
      },
    });
  }
};

  const handleRefresh = async () => {
    setRefreshing(true);
    await sleep(500);
    await fetchData();
    setRefreshing(false);
  };

  const getTitle = () => {
    if (isProgramChair) return 'Faculty Members 👨‍🏫';
    if (isSupervisor)   return 'Program Chairs 📋';
    return 'The Teaching Staff 🧑‍🏫';
  };

  const getEmptyMessage = () => {
    if (isProgramChair) return 'No Faculty Members Yet';
    if (isSupervisor)   return 'No Program Chairs Yet';
    return 'No Instructors Yet';
  };

  const getAddButtonText = () => {
    if (isProgramChair) return 'Add The First Faculty';
    if (isSupervisor)   return 'Add The First Program Chair';
    return 'Add The First Instructor';
  };

  const renderInstructorItem = useCallback(({ item }) => (
    <TouchableOpacity style={styles.bookItem} onPress={() => handleNavigate(item)}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.bookImage} />
      ) : (
        <View style={[styles.bookImage, styles.placeholderImage]}>
          <Ionicons name="person" size={30} color="#999" />
        </View>
      )}

      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.name}</Text>
        {!isSupervisor && (
          <Text style={styles.bookCaption} numberOfLines={2}>{item.department}</Text>
        )}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{item.type}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDelete(item._id, item.name)}
      >
        {deleteInstructorId === item._id ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  ), [deleteInstructorId, isSupervisor]); // ✅ only re-renders list items when delete state changes

  if (isLoading && !refreshing) return <Loader />;

  return (
    <View style={styles.container}>
      <ProfileHeader />

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.booksHeader}>
        <Text style={styles.booksTitle}>{getTitle()}</Text>
        <Text style={styles.booksCount}>
          {instructors.length}{' '}
          {isProgramChair ? 'Faculty' : isSupervisor ? 'Program Chairs' : 'Instructors'}
        </Text>
      </View>

      <FlatList
        data={instructors}
        renderItem={renderInstructorItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksList}
        removeClippedSubviews={true} // ✅ Reduces memory on long lists
        maxToRenderPerBatch={10}      // ✅ Renders in batches — smoother scrolling
        windowSize={5}                // ✅ Smaller render window — less memory
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={50} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/Create")}>
              <Text style={styles.addButtonText}>{getAddButtonText()}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

export default Profile;