import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting}</Text>
      
      <Text style={styles.heading}>Forums</Text>
      <Text style={styles.placeholderText}>Forums section (coming soon)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  greeting: {
    color: "#A7D129",
    fontSize: 35,
    fontWeight: "700",
  },
  heading: {
    color: "#A7D129",
    fontSize: 25,
    marginTop: 30,
    fontWeight: "600",
  },
  placeholderText: {
    color: "#616F39",
    fontSize: 16,
    marginTop: 10,
  },
});
