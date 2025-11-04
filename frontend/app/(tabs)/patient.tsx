import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { API_BASE } from "../../baseApi";

export default function PatientsScreen() {
  const [loading, setLoading] = useState(true);
  const [escalations, setEscalations] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadEscalations = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          Alert.alert("Session expired", "Please log in again.");
          router.replace("/auth");
          return;
        }
        const res = await fetch(`${API_BASE}/escalations/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch escalations");
        const data = await res.json();
        setEscalations(data);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Could not load escalations");
      } finally {
        setLoading(false);
      }
    };
    loadEscalations();
  }, []);

  const handlePress = (id: number) => {
    router.push(`/escalation/${id}`);
  };

  const extractNotes = (metadata: string) => {
    try {
      const parsed = JSON.parse(metadata);
      return parsed.notes?.trim() || "No notes provided";
    } catch {
      return "No notes provided";
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#A7D129" />
        <Text style={styles.loadingText}>Loading escalations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Escalations</Text>
      {escalations.length === 0 ? (
        <Text style={styles.noData}>No escalations yet</Text>
      ) : (
        <FlatList
          data={escalations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const reason = extractNotes(item.image?.metadata);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handlePress(item.id)}
              >
                {item.image?.image_url && (
                  <Image
                    source={{ uri: item.image.image_url }}
                    style={styles.image}
                  />
                )}
                <Text style={styles.username}>@{item.patient.username}</Text>
                <Text style={styles.reason}>Reason: {reason}</Text>
                <Text style={styles.time}>
                  {new Date(item.submitted_at).toLocaleString()}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    color: "#A7D129",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#3E432E",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  username: { color: "#A7D129", fontWeight: "700", fontSize: 16 },
  reason: { color: "#FFFFFF", fontSize: 15, marginTop: 4 },
  time: { color: "#616F39", fontSize: 12, marginTop: 5 },
  noData: { color: "#616F39", fontSize: 16, textAlign: "center", marginTop: 30 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: { color: "#A7D129", marginTop: 10, fontSize: 16 },
});
