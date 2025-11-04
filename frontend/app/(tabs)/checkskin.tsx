import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, TextInput, StyleSheet, Modal, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../baseApi";

export default function UploadScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState<number | null>(null);

  const requestPermission = async (type: "camera" | "gallery") => {
    const permission =
      type === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    return permission.granted;
  };

  const pickImage = async () => {
    const granted = await requestPermission("gallery");
    if (!granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const granted = await requestPermission("camera");
    if (!granted) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleUpload = async () => {
    if (!imageUri) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      const metadataObject = {
        notes: info || "No notes provided",
        uploadedFrom: "mobile",
        timestamp: new Date().toISOString(),
      };
      formData.append("metadata", JSON.stringify(metadataObject));

      const res = await fetch(`${API_BASE}/upload/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();

      if (res.ok) {
        setUploadedImageId(json.data?.id);
        setShowPrompt(true);
        setImageUri(null);
        setInfo("");
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!uploadedImageId) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) return;

      const body = JSON.stringify({
        image_id: uploadedImageId,
        reason: info || "No notes provided",
      });

      const res = await fetch(`${API_BASE}/escalate/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      });

      const json = await res.json();
      console.log("Escalation result:", json);
    } catch (err) {
      console.error("Escalation error:", err);
    } finally {
      setLoading(false);
      setShowPrompt(false);
      setUploadedImageId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Image</Text>
      <Text style={styles.subtitle}>
        Your data is safe. We do not store your data without your permission
      </Text>

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

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handleUpload}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.uploadText}>Upload</Text>
        )}
      </TouchableOpacity>

      {/* Modal Prompt */}
      <Modal visible={showPrompt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Escalate to Doctor?</Text>
            <Text style={styles.modalText}>
              Do you want to send this image for medical review?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelBtn]}
                onPress={() => setShowPrompt(false)}
              >
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmBtn]}
                onPress={handleEscalate}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
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
    backgroundColor: "#3E432E",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#3E432E",
    padding: 25,
    borderRadius: 12,
    width: "80%",
  },
  modalTitle: {
    color: "#A7D129",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  modalText: {
    color: "#FFF",
    textAlign: "center",
    fontSize: 15,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelBtn: {
    backgroundColor: "#616F39",
  },
  confirmBtn: {
    backgroundColor: "#A7D129",
  },
  modalButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
});
