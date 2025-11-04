import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../../baseApi";

export default function EscalationDetail() {
  const { id } = useLocalSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const extractNotes = (metadata: string) => {
    try {
      const parsed = JSON.parse(metadata);
      return parsed.notes?.trim() || "No notes provided";
    } catch {
      return "No notes provided";
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          Alert.alert("Session expired", "Please log in again.");
          router.replace("/auth");
          return;
        }
        const res = await fetch(`${API_BASE}/escalations/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch details");
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Could not load escalation details");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#A7D129" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No data found</Text>
      </View>
    );
  }

  const reason = extractNotes(data.image?.metadata);

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Escalation Details</Text>
      <Text style={styles.username}>Patient: @{data.patient.username}</Text>
      <Text style={styles.reason}>Reason: {reason}</Text>
      <Text style={styles.contact}>
        Contact Number: {data.contact_number || "Not provided"}
      </Text>

      {data.image?.image_url && (
        <Image source={{ uri: data.image.image_url }} style={styles.image} />
      )}

      <View style={styles.infoBox}>
        <Text style={styles.detail}>Status: {data.status}</Text>
        <Text style={styles.detail}>
          Submitted: {new Date(data.submitted_at).toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  backBtn: { marginBottom: 10 },
  backText: { color: "#A7D129", fontSize: 16 },
  title: { color: "#A7D129", fontSize: 24, fontWeight: "700", marginBottom: 10 },
  username: { color: "#FFFFFF", fontSize: 18, marginVertical: 4 },
  reason: { color: "#A7D129", fontSize: 16, marginBottom: 5 },
  contact: { color: "#F5F5F5", fontSize: 15, marginBottom: 15 },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoBox: {
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 10,
    borderColor: "#3E432E",
    borderWidth: 1,
  },
  detail: { color: "#FFF", fontSize: 15, marginVertical: 2 },
  center: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "#A7D129", marginTop: 10 },
  error: { color: "#FF5252", fontSize: 16 },
});
