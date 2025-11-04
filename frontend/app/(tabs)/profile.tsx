import React, { useEffect, useState } from "react";
import { View, Image, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import {API_BASE} from "../../baseApi"

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("userRole");
        setRole(storedRole);
      } catch (err) {
        console.error("Error loading role:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRole();
  }, []);

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Not logged in", "Please log in again.");
        router.replace("/auth");
        return;
      }
      const res = await fetch(`${API_BASE}/user/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser(data);
    } catch (error) {
      console.error("Error fetching user:", error);
      Alert.alert("Error", "Could not load user details");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
  try {
    const username = await AsyncStorage.getItem("username");
    if (username) {
      await AsyncStorage.removeItem(`chatMessages_${username}`);
      await AsyncStorage.removeItem("username");
    }

    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
    router.replace("/auth");
  } catch (error) {
    console.error("Error logging out:", error);
    Alert.alert("Error", "Could not log out");
  }
};


  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#A7D129" />
        <Text style={styles.loading}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user data found. Please log in again.</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/default-profile.png")}
        style={styles.image}
      />
      <Text style={styles.name}>{user.first_name || user.username}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.detail}>Username: @{user.username}</Text>
        <Text style={styles.detail}>Role: {role}</Text>
        {user.role && <Text style={styles.detail}>Role: {user.role}</Text>}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#A7D129",
    marginBottom: 16,
  },
  name: {
    color: "#A7D129",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 12,
    padding: 16,
    width: "90%",
    marginBottom: 30,
  },
  detail: {
    color: "#FFFFFF",
    fontSize: 16,
    marginVertical: 4,
  },
  logoutButton: {
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loading: {
    color: "#A7D129",
    fontSize: 18,
    marginTop: 10,
  },
  errorText: {
    color: "#FF5252",
    fontSize: 16,
    marginBottom: 10,
  },
});
