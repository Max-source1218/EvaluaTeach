import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import { apiFetch } from '../../lib/apiFetch';
import styles from '../../assets/styles/home.styles';
import COLORS from '../../constants/colors';
import Loader from '../../components/Loader';
import Sidebar from '../../components/Sidebar';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PAGE_LIMIT = 10;

export default function Dashboard() {
  const { token, user } = useAuthStore();
  const router          = useRouter();

  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSupervisor = user?.role === 'Supervisor';

  // ✅ useMemo — only recomputes when role changes
  const endpoint = useMemo(() => (
    isSupervisor
      ? `${API_URL}/admin/program-chairs`
      : `${API_URL}/admin/faculty`
  ), [isSupervisor]);

  const title = useMemo(() => (
    isSupervisor ? 'Program Chairs' : 'Faculty'
  ), [isSupervisor]);

  // ✅ Sidebar only has evaluate actions now — tabulation reached via cards
  const menuItems = useMemo(() => {
    if (isSupervisor) {
      return [
        {
          label: 'Evaluate Program Chair 📝',
          icon: 'create-outline',
          onPress: () => {
            router.push('/(record_admin)/SupervisorForm');
            setSidebarOpen(false);
          },
        },
      ];
    }
    return [
      {
        label: 'Evaluate Faculty 📝',
        icon: 'create-outline',
        onPress: () => {
          router.push('/(record_admin)/FacultyForm');
          setSidebarOpen(false);
        },
      },
    ];
  }, [isSupervisor]);

  // ✅ useCallback — stable reference, correct deps
  const fetchItems = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      const data = await apiFetch(
        `${endpoint}?page=${pageNum}&limit=${PAGE_LIMIT}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Clean deduplication using Map — O(n) instead of O(n²)
      setItems(prev => {
        if (refresh || pageNum === 1) return data;
        const map = new Map(prev.map(i => [i._id, i]));
        data.forEach(i => map.set(i._id, i));
        return Array.from(map.values());
      });

      // ✅ hasMore: if backend returns fewer than limit, no more pages
      setHasMore(data.length === PAGE_LIMIT);
      setPage(pageNum);
    } catch (err) {
      // silent — apiFetch already throws with message
    } finally {
      if (refresh) {
        await sleep(800);
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [endpoint, token]);

  useEffect(() => {
    if (user) fetchItems(1);
  }, [user, fetchItems]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading && !refreshing) {
      fetchItems(page + 1);
    }
  }, [hasMore, loading, refreshing, page, fetchItems]);

  const formatDate = useCallback((dateString) => (
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  ), []);

  // ✅ Navigate to SubjectInput (for evaluation flow)
  const handleEvaluate = useCallback((item) => {
    const pathname = isSupervisor
      ? '/(record_admin)/SubjectInput'
      : '/(record_admin)/FacultySubjectInput';

    router.push({
      pathname,
      params: {
        instructorId: item._id,
        department:   item.department,
        userType:     user?.role,
      },
    });
    setSidebarOpen(false);
  }, [isSupervisor, user?.role]);

 const handleTabulation = useCallback((item) => {
  if (isSupervisor) {
    router.push({
      pathname: '/ChairTabulationSchoolYears',  // ✅ was ChairTabulationSemesters
      params: {
        programChairId:   item._id,
        programChairName: item.username,
        department:       item.department,
      },
    });
  } else {
    router.push({
      pathname: '/FacultyTabulationSchoolYears', // ✅ was FacultyTabulationSemesters
      params: {
        facultyId:   item._id,
        facultyName: item.username,
        department:  item.department,
      },
    });
  }
}, [isSupervisor]);

  const renderItem = useCallback(({ item }) => (
    <View style={styles.bookCard}>
      <View style={styles.bookHeader}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: item.profileImage }}
            style={styles.avatar}
          />
          <Text style={styles.username}>{item.username || 'Unknown User'}</Text>
        </View>
      </View>

      <View style={styles.bookImageContainer}>
        <Image
          source={{ uri: item.profileImage }}
          style={styles.bookImage}
          contentFit="cover"
        />
      </View>

      <View style={cardStyles.actionRow}>
      
        <TouchableOpacity
          style={[cardStyles.actionBtn, cardStyles.assignBtn]}
          onPress={() => handleEvaluate(item)}
        >
          <Ionicons name="book-outline" size={16} color="#fff" />
          <Text style={cardStyles.actionBtnText}>Assign Subject</Text>
        </TouchableOpacity>

        {/* ✅ Tabulation Results button */}
        <TouchableOpacity
          style={[cardStyles.actionBtn, cardStyles.tabulationBtn]}
          onPress={() => handleTabulation(item)}
        >
          <Ionicons name="bar-chart-outline" size={16} color="#fff" />
          <Text style={cardStyles.actionBtnText}>Tabulation</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [formatDate, handleEvaluate, handleTabulation]);

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        menuItems={menuItems}
      />

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchItems(1, true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setSidebarOpen(true)}
              style={cardStyles.menuButton}
            >
              <Ionicons name="menu" size={24} color={COLORS.text || '#000'} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>EvaluaTeach ✒️</Text>
            <Text style={styles.headerSubtitle}>Evaluate {title}</Text>
          </View>
        }
        ListFooterComponent={
          hasMore && items.length > 0
            ? <ActivityIndicator style={styles.footerLoader} size="small" color={COLORS.primary} />
            : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No {title}</Text>
            <Text style={styles.emptySubtext}>
              {isSupervisor
                ? 'No program chairs have been registered yet'
                : 'No faculty members have been registered yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const cardStyles = StyleSheet.create({
  menuButton: {
    position: 'absolute',
    left: 10,
    top: 10,
    zIndex: 1,
  },
  actionRow: {
    flexDirection: 'row',          // ✅ side by side
    gap: 8,                        // ✅ spacing between buttons
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
  },
  actionBtn: {
    flex: 1,                       // ✅ equal width
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  assignBtn: {
    backgroundColor: '#4CAF50',   // ✅ green for assign
  },
  tabulationBtn: {
    backgroundColor: '#4A90E2',   // ✅ blue for tabulation
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});