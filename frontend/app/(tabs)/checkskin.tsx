import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://192.168.29.232:8000/api";

export default function UploadScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const requestPermission = async (type: "camera" | "gallery") => {
    const permission =
      type === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission denied", `Allow ${type} access to continue.`);
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const granted = await requestPermission("gallery");
    if (!granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const granted = await requestPermission("camera");
    if (!granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert("No Image", "Please select or capture an image first.");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "You need to be logged in.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      // Send metadata as JSON string
      const metadataObject = {
        notes: info || "No notes provided",
        uploadedFrom: "mobile",
        timestamp: new Date().toISOString(),
      };
      formData.append("metadata", JSON.stringify(metadataObject));

      const res = await fetch(`${API_BASE}/upload/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type manually — let fetch handle it for FormData
        },
        body: formData,
      });

      const responseText = await res.text();

      if (!res.ok) {
        console.error("Upload failed:", responseText);
        Alert.alert("Error", `Upload failed: ${responseText}`);
      } else {
        console.log("Success:", responseText);
        Alert.alert("Success", "Image uploaded successfully!");
        setImageUri(null);
        setInfo("");
      }
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Error", "Something went wrong while uploading.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Image</Text>
      <Text style={styles.subtitle}>Your data is safe. We do not store your data without your permission</Text>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Select from Gallery</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={takePhoto}>
        <Text style={styles.buttonText}>Take a Photo</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Enter metadata or notes"
        placeholderTextColor="#777"
        value={info}
        onChangeText={setInfo}
      />

      <TouchableOpacity style={styles.uploadButton} onPress={handleUpload} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.uploadText}>Upload</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: "#A7D129",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
  },
  preview: {
    width: "100%",
    height: 260,
    borderRadius: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2E2E2E",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#A7D129",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#1A1A1A",
    color: "#FFF",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  uploadButton: {
    backgroundColor: "#A7D129",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 25,
    alignItems: "center",
  },
  uploadText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
});