import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function CheckSkinScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Check Skin feature (coming soon)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#A7D129",
    fontSize: 18,
  },
});
