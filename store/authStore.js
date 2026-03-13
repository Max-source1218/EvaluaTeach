import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

export const useAuthStore = create((set) => ({
    user: null,
    token: null,
    isLoading: false,
    error: null,

    register: async (username, email, password, role) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, role }),
            });

            const data = await response.json();
            if (!response.ok) {
                set({ isLoading: false, error: data.message });
                return { success: false, error: data.message };
            }

            // ✅ Consistent shape — always use _id, never remap to id
            const user = {
                _id: data.user._id,
                username: data.user.username,
                email: data.user.email,
                profileImage: data.user.profileImage,
                role: data.user.role,
            };

            await AsyncStorage.setItem("token", data.token);
            await AsyncStorage.setItem("user", JSON.stringify(user));
            set({ user, token: data.token, isLoading: false, error: null });

            return { success: true };
        } catch (error) {
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                set({ isLoading: false, error: data.message });
                return { success: false, error: data.message };
            }

            // ✅ Same shape as register — _id consistent across login + checkAuth
            const user = {
                _id: data.user._id,
                username: data.user.username,
                email: data.user.email,
                profileImage: data.user.profileImage,
                role: data.user.role,
            };

            await AsyncStorage.setItem("token", data.token);
            await AsyncStorage.setItem("user", JSON.stringify(user));
            set({ user, token: data.token, isLoading: false, error: null });

            return { success: true };
        } catch (error) {
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
        }
    },

    checkAuth: async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const userStr = await AsyncStorage.getItem("user");

            if (token && userStr) {
                const user = JSON.parse(userStr);
                set({ token, user });
            } else {
                set({ token: null, user: null });
            }
        } catch (error) {
            console.error("Auth check failed:", error.message);
            await AsyncStorage.multiRemove(["token", "user"]);
            set({ token: null, user: null });
        }
    },

    logout: async () => {
    // ✅ Clear all role sessions on logout — prevents stale state collision
    await AsyncStorage.multiRemove([
        "token", "user",           // admin
        "student_token", "student", // student
        "faculty_token", "faculty", // faculty
    ]);
    set({ token: null, user: null, error: null });
},
}));