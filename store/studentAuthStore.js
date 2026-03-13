import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/api";

// ✅ Renamed to useStudentAuthStore — avoids naming conflict with useAuthStore
export const useStudentAuthStore = create((set) => ({
    student: null,
    token: null,
    isLoading: false,
    error: null,

    register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/student/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                set({ isLoading: false, error: data.message });
                return { success: false, error: data.message };
            }

            const student = {
                _id: data.student._id,
                username: data.student.username,
                email: data.student.email,
                profileImage: data.student.profileImage,
            };

            await AsyncStorage.setItem("student_token", data.token);
            await AsyncStorage.setItem("student", JSON.stringify(student));
            set({ token: data.token, student, isLoading: false, error: null });

            return { success: true };
        } catch (error) {
            console.error("Registration error:", error.message);
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/student/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                set({ isLoading: false, error: data.message });
                return { success: false, error: data.message };
            }

            const student = {
                _id: data.student._id,
                username: data.student.username,
                email: data.student.email,
                profileImage: data.student.profileImage,
            };

            await AsyncStorage.setItem("student_token", data.token);
            await AsyncStorage.setItem("student", JSON.stringify(student));
            set({ token: data.token, student, isLoading: false, error: null });

            return { success: true };
        } catch (error) {
            console.error("Login error:", error.message);
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
        }
    },

    checkAuth: async () => {
        try {
            const token = await AsyncStorage.getItem("student_token");
            const studentJson = await AsyncStorage.getItem("student");

            if (token && studentJson) {
                const student = JSON.parse(studentJson);
                set({ token, student });
            } else {
                set({ token: null, student: null });
            }
        } catch (err) {
            console.error("Auth check failed:", err.message);
            await AsyncStorage.multiRemove(["student_token", "student"]);
            set({ token: null, student: null });
        }
    },

   logout: async () => {
    await AsyncStorage.multiRemove([
        "token", "user",
        "student_token", "student",
        "faculty_token", "faculty",
    ]);
    set({ token: null, student: null, error: null });
},
}));