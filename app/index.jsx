import { View, Text, StyleSheet, ImageBackground, Pressable, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuthStore }        from '../store/authStore';
import { useStudentAuthStore } from '../store/studentAuthStore';
import { useFacultyAuthStore } from '../store/facultyAuthStore';

import college from '@/assets/images/480731229_1137043401546648_6501449711966962977_n.jpg';
import logo    from '@/assets/images/58908bc2-67dc-4cfb-bf14-c19b4451d558.jpg';

export default function App() {
  const router = useRouter();

  const { user:    adminUser,   token: adminToken,   checkAuth: checkAdminAuth   } = useAuthStore();
  const { student: studentUser, token: studentToken, checkAuth: checkStudentAuth } = useStudentAuthStore();
  const { faculty: facultyUser, token: facultyToken, checkAuth: checkFacultyAuth } = useFacultyAuthStore();

  const [authChecked, setAuthChecked] = useState(false);

  // ✅ Wait for ALL auth checks to complete before redirecting
  useEffect(() => {
    Promise.all([
      checkAdminAuth(),
      checkStudentAuth(),
      checkFacultyAuth(),
    ]).finally(() => setAuthChecked(true));
  }, []);

  // ✅ Only redirect after auth checks are done — prevents race condition
  useEffect(() => {
    if (!authChecked) return;

    if (adminUser && adminToken) {
      router.replace('/(tabs_admin)/Dashboard');
    } else if (studentUser && studentToken) {
      router.replace('/(tabs_student)/Student_Form');
    } else if (facultyUser && facultyToken) {
      router.replace('/(tabs_faculty)/Dashboard_Faculty');
    }
  }, [authChecked, adminUser, adminToken, studentUser, studentToken, facultyUser, facultyToken]);

  return (
    <View style={styles.container}>
      <ImageBackground source={college} resizeMode="cover" style={styles.image}>
        <View style={styles.form}>
          <Image source={logo} style={styles.headerImg} />
          <Text style={styles.text}>EvaluaTeach</Text>

          <Link href="/(auth_admin)/sign-in(admin)" style={{ marginHorizontal: 'auto' }} asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Admin</Text>
            </Pressable>
          </Link>

          <Link href="/(auth_student)/sign-in(student)" style={{ marginHorizontal: 'auto' }} asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Student</Text>
            </Pressable>
          </Link>

          <Link href="/(auth_faculty)/sign-in(faculty)" style={{ marginHorizontal: 'auto' }} asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Faculty</Text>
            </Pressable>
          </Link>
        </View>
      </ImageBackground>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, flexDirection: 'column' },
  form:       { backgroundColor: 'rgba(0,0,0,0.75)', opacity: 0.8, height: '100%', width: '100%' },
  text:       { color: 'white', fontSize: 57, fontWeight: 'bold', textAlign: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', marginBottom: 20, marginTop: 30, fontFamily: 'Times New Roman' },
  button:     { height: 50, width: 150, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,119,255,1)', padding: 4, margin: 5, marginTop: 20 },
  headerImg:  { width: 150, height: 150, alignSelf: 'center', marginBottom: 10, borderRadius: 500, marginTop: 79 },
  buttonText: { color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', justifyContent: 'center', padding: 5 },
  image:      { width: '100%', height: '100%', flex: 1, resizeMode: 'cover', justifyContent: 'center' },
});