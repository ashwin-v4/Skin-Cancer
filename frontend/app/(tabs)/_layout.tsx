import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("userRole");
        console.log("Loaded role:", storedRole); // Log the value from storage
        setRole(storedRole);
      } catch (err) {
        console.error("Error loading role:", err);
      }
    };
    loadRole();
  }, []);

  // Add this to see when role updates
  useEffect(() => {
    console.log("Current role state:", role);
  }, [role]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#A7D129",
        tabBarInactiveTintColor: "#616F39",
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopColor: "#3E432E",
        },
      }}
    >
      {/* Hidden routes */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="post/[id]" options={{ href: null }} />
      <Tabs.Screen name="escalation/[id]" options={{ href: null }} />
      {/* Home tab - always visible */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Check Skin tab - only for patients */}
      <Tabs.Screen
        name="checkskin"
        options={{
          title: "Check Skin",
          href: role === "patient" ? "/checkskin" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />

      {/* Chat tab - only for patients */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "AI Chat",
          href: role === "patient" ? "/chat" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Patient tab - only for doctors */}
      <Tabs.Screen
        name="patient"
        options={{
          title: "Patients",
          href: role === "doctor" ? "/patient" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Profile tab - always visible */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}