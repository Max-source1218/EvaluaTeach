import { Tabs, Redirect, usePathname } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';

const TabsLayout = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const pathname = usePathname();
  
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Get user role
  const userRole = user?.role || '';
  const isProgramChair = userRole === 'Program Chair';
  const isSupervisor = userRole === 'Supervisor';

  if (!isReady || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e8f5e9' }}>
        <ActivityIndicator size="large" color="#2e5a2e" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2e5a2e",
        headerTitleStyle: {
          color: "#2e5a2e",
          fontWeight: "600",
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: "#e8f5e9",
          borderTopWidth: 1,
          borderTopColor: "#c8e6c9",
          paddingTop: 5,
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
        }
      }}
    >
      <Tabs.Screen 
        name="Dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          )
        }}
      />
      
      {/* Show Create tab for BOTH Program Chair AND Supervisor */}
      {(isProgramChair || isSupervisor) && (
        <Tabs.Screen 
          name="Create"
          options={{
            title: "Create",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle-outline" size={size} color={color} />
            )
          }}
        />
      )}
      
      {/* Show Subjects tab for BOTH Program Chair and Supervisor */}
      {(isProgramChair || isSupervisor) && (
        <Tabs.Screen 
          name="Subjects"
          options={{
            title: "Subjects",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book-outline" size={size} color={color} />
            )
          }}
        />
      )}
      
      <Tabs.Screen 
        name="Profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          )
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;