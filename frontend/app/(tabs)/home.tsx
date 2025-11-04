import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Button,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {API_BASE} from "../../baseApi"

export default function HomeScreen() {
  const [greeting, setGreeting] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const load = async () => {
      const storedToken = await AsyncStorage.getItem("accessToken");
      setToken(storedToken);
      fetchPosts(storedToken);
    };
    load();
  }, []);

  const fetchPosts = async (accessToken: string | null) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/posts/`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts:", err);
      Alert.alert("Error", "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPost = async () => {
    if (!newContent.trim()) {
      Alert.alert("Empty", "Please enter some content");
      return;
    }

    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      if (!accessToken) {
        Alert.alert("Not logged in", "You must log in before posting.");
        return;
      }

      const res = await fetch(`${API_BASE}/post/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content: newContent }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.log("Create post failed:", res.status, text);
        throw new Error("Failed to create post");
      }

      Alert.alert("Success", "Post created!");
      setShowModal(false);
      setNewContent("");
      fetchPosts(accessToken);
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Could not create post");
    }
  };

  const handlePressPost = (id: number) => {
    router.push(`/post/${id}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting}</Text>
      <View style={styles.header}>
        <Text style={styles.heading}>Forums</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.createText}>+ Create Post</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.placeholderText}>Loading posts...</Text>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.postCard}
              onPress={() => handlePressPost(item.id)}
            >
              <Text style={styles.postUser}>
                @{item.user?.username || item.user}
              </Text>
              <Text style={styles.postContent}>{item.content}</Text>
              <Text style={styles.postMeta}>
                {new Date(item.created_at).toLocaleString()} •{" "}
                {item.comments_count || 0} comments
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Create Post Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Post</Text>
            <TextInput
              value={newContent}
              onChangeText={setNewContent}
              placeholder="Write your post..."
              placeholderTextColor="#999"
              style={styles.input}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.postBtn}
                onPress={handleSubmitPost}
              >
                <Text style={styles.btnText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cancelBtn: {
    backgroundColor: "#555",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  postBtn: {
    backgroundColor: "#A7D129",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },

  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  greeting: { color: "#A7D129", fontSize: 35, fontWeight: "700" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  heading: { color: "#A7D129", fontSize: 25, fontWeight: "600" },
  createButton: {
    backgroundColor: "#3E432E",
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  createText: { color: "#A7D129", fontWeight: "600" },
  postCard: {
    backgroundColor: "#3E432E",
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
  },
  postUser: { color: "#A7D129", fontWeight: "700", fontSize: 14 },
  postContent: { color: "#FFFFFF", fontSize: 16, marginTop: 5 },
  postMeta: { color: "#616F39", fontSize: 12, marginTop: 8 },
  placeholderText: { color: "#616F39", fontSize: 16, marginTop: 10 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalBox: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 10,
    width: "90%",
  },
  modalTitle: {
    color: "#A7D129",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
});
