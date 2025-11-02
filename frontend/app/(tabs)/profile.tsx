import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/default-profile.png")}
        style={styles.image}
      />
      <Text style={styles.name}>User Name</Text>
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
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#A7D129",
  },
  name: {
    color: "#A7D129",
    fontSize: 18,
    marginTop: 12,
  },
});
