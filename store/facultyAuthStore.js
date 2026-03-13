import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/api";

export const useFacultyAuthStore = create((set) => ({
    faculty: null,
    token: null,
    isLoading: false,
    error: null,

    // ✅ Kept but note: this should only be called by Supervisor/PC screens
    // not exposed to faculty users themselves
    register: async (username, email, password, department, token) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/faculty/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, // ✅ Requires Supervisor token
                },
                body: JSON.stringify({ username, email, password, department }),
            });

            const data = await response.json();
            if (!response.ok) {
                set({ isLoading: false, error: data.message });
                return { success: false, error: data.message };
            }

            set({ isLoading: false, error: null });
            return { success: true, faculty: data.faculty };
        } catch (error) {
            console.error("Registration error:", error.message);
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/faculty/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                set({ isLoading: false, error: data.message });
                return { success: false, error: data.message };
            }

            const faculty = {
                _id: data.faculty._id,
                username: data.faculty.username,
                email: data.faculty.email,
                profileImage: data.faculty.profileImage,
                department: data.faculty.department,
            };

            await AsyncStorage.setItem("faculty_token", data.token);
            await AsyncStorage.setItem("faculty", JSON.stringify(faculty));
            set({ token: data.token, faculty, isLoading: false, error: null });

            return { success: true };
        } catch (error) {
            console.error("Login error:", error.message);
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
        }
    },

    checkAuth: async () => {
        try {
            const token = await AsyncStorage.getItem("faculty_token");
            const facultyJson = await AsyncStorage.getItem("faculty");

            if (token && facultyJson) {
                const faculty = JSON.parse(facultyJson);
                set({ token, faculty });
            } else {
                set({ token: null, faculty: null });
            }
        } catch (err) {
            console.error("Auth check failed:", err.message);
            await AsyncStorage.multiRemove(["faculty_token", "faculty"]);
            set({ token: null, faculty: null });
        }
    },

logout: async () => {
    await AsyncStorage.multiRemove([
        "token", "user",
        "student_token", "student",
        "faculty_token", "faculty",
    ]);
    set({ token: null, faculty: null, error: null });
},
}));