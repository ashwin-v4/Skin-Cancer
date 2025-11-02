import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
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
      {/* Hidden route for redirect logic */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />

      {/* Home tab */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Check Skin tab */}
      <Tabs.Screen
        name="checkskin"
        options={{
          title: "Check Skin",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />

      {/* Profile tab */}
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
