import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PatientsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Patient Requests</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#A7D129",
    fontSize: 20,
    fontWeight: "600",
  },
});
