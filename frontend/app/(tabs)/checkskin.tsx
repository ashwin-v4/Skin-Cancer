import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../baseApi";

type FieldName =
  | "smoke"
  | "drink"
  | "background_father"
  | "background_mother"
  | "skin_cancer_history"
  | "cancer_history"
  | "itch"
  | "grew"
  | "hurt"
  | "changed"
  | "bleed"
  | "elevation";

type AnswerValue = 1 | 0 | -1 | null;

export default function UploadScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<any | null>(null);

  const [metadata, setMetadata] = useState<Record<FieldName, AnswerValue>>({
    smoke: null,
    drink: null,
    background_father: null,
    background_mother: null,
    skin_cancer_history: null,
    cancer_history: null,
    itch: null,
    grew: null,
    hurt: null,
    changed: null,
    bleed: null,
    elevation: null,
  });

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
    setPrediction(null);
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
        ...metadata,
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
        setUploadedImageId(json.image?.id || json.data?.id);
        setPrediction(json.prediction || null);
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

  const handleSendToDoctor = async () => {
  if (!uploadedImageId) return;
  setLoading(true);
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) return;

    const reason = JSON.stringify(metadata);

    const res = await fetch(`${API_BASE}/escalate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        image_id: uploadedImageId,
        reason,
      }),
    });

    const json = await res.json();
    if (res.ok) {
      console.log("Escalation successful:", json);
      setShowPrompt(false);
      alert("Image sent to doctor for review.");
    } else {
      console.error("Escalation failed:", json);
      alert("Failed to escalate. Try again.");
    }
  } catch (err) {
    console.error("Error escalating image:", err);
  } finally {
    setLoading(false);
  }
};

  const renderField = (field: FieldName) => (
    <View key={field} style={{ marginBottom: 10 }}>
      <Text style={styles.fieldLabel}>
        {field.replaceAll("_", " ").toUpperCase()}
      </Text>
      <View style={styles.optionRow}>
        {[
          { label: "Yes", value: 1 },
          { label: "No", value: 0 },
          { label: "Unknown", value: -1 },
        ].map((option) => (
          <TouchableOpacity
            key={option.label}
            style={[
              styles.optionButton,
              metadata[field] === option.value && styles.optionSelected,
            ]}
            onPress={() =>
              setMetadata((prev) => ({ ...prev, [field]: option.value }))
            }
          >
            <Text
              style={[
                styles.optionText,
                metadata[field] === option.value && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
  <View style={{ flex: 1, backgroundColor: "#000" }}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }} // gives space for the bottom button
    >
      <Text style={styles.title}>Upload Image</Text>
      <Text style={styles.subtitle}>
        Please answer the following questions before uploading.
      </Text>

      {(Object.keys(metadata) as FieldName[]).map((field) => renderField(field))}

      {/* <TextInput
        style={styles.input}
        placeholder="Enter notes"
        placeholderTextColor="#777"
        value={info}
        onChangeText={setInfo}
      /> */}

      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Select from Gallery</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={takePhoto}>
        <Text style={styles.buttonText}>Take a Photo</Text>
      </TouchableOpacity>

      {/* Upload button placed below the other buttons inside the ScrollView */}
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
    </ScrollView>

    {/* ✅ Modal */}
    <Modal visible={showPrompt} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      {prediction ? (
        <>
          <Text style={styles.modalTitle}>Result</Text>
          <Text style={styles.modalResultText}>
            Prediction: {prediction.prediction || "N/A"}
          </Text>
          <Text style={styles.modalResultText}>
            Confidence: {prediction.confidence_level || "N/A"}
          </Text>
          <Text style={styles.modalResultText}>
            Probability:{" "}
            {prediction.probability
              ? `${(prediction.probability * 100).toFixed(2)}%`
              : "N/A"}
          </Text>
        </>
      ) : (
        <Text style={styles.modalText}>Processing complete.</Text>
      )}

      {/* ✅ Action buttons inside same box */}
      <View style={styles.modalButtonRow}>
        <TouchableOpacity
          style={[styles.modalButton, styles.cancelBtn]}
          onPress={() => setShowPrompt(false)}
        >
          <Text style={styles.modalButtonText}>Cancel</Text>
        </TouchableOpacity>

       <TouchableOpacity
          style={[styles.modalButton, styles.confirmBtn]}
          onPress={handleSendToDoctor}
        >
          <Text style={styles.modalButtonText}>Send to Doctor</Text>
        </TouchableOpacity>

      </View>
    </View>
  </View>
</Modal>

  </View>
);

}
const styles = StyleSheet.create({
  uploadButton: {
    backgroundColor: "#A7D129",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },

  container: {
    flex: 1,
    backgroundColor: "#000",
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
    marginVertical: 20,
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
    marginBottom: 20,
  },
  uploadText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
  fieldLabel: {
    color: "#FFF",
    marginBottom: 5,
    fontSize: 14,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionButton: {
    flex: 1,
    backgroundColor: "#2A2A2A",
    paddingVertical: 8,
    marginHorizontal: 3,
    borderRadius: 6,
    alignItems: "center",
  },
  optionSelected: { backgroundColor: "#A7D129" },
  optionText: { color: "#FFF", fontSize: 13 },
  optionTextSelected: { color: "#000", fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#3E432E",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    alignItems: "center",
  },
  modalTitle: {
    color: "#A7D129",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalResultText: {
    color: "#FFF",
    fontSize: 14,
    marginBottom: 5,
  },
  modalText: {
    color: "#FFF",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 10,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelBtn: {
    backgroundColor: "#FF5555",
    flex: 1,
    marginRight: 8,
  },
  confirmBtn: {
    backgroundColor: "#A7D129",
    flex: 1,
    marginLeft: 8,
  },
  modalButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
} as const);

