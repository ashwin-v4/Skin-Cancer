import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://192.168.29.232:8000/api";

export default function PostDetail() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (id) fetchPost();
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/posts/${id}/`);
      const data = await res.json();
      setPost(data);
      setComments(data.comments || []);
    } catch (e) {
      console.error("Error fetching post:", e);
      Alert.alert("Error", "Could not load post details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert("Error", "Please write a comment");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Error", "You must be logged in to comment");
        return;
      }

      const res = await fetch(`${API_BASE}/comment/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post: id,
          comment: commentText,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        Alert.alert("Error", "Failed to add comment");
        return;
      }

      setCommentText("");
      setShowModal(false);
      await fetchPost(); // refresh comments
    } catch (e) {
      console.error("Error adding comment:", e);
      Alert.alert("Error", "Could not add comment");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>No post found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.username}>@{post.user?.username || post.user}</Text>
      <Text style={styles.content}>{post.content}</Text>
      <Text style={styles.meta}>
        {new Date(post.created_at).toLocaleString()}
      </Text>

      <TouchableOpacity
        style={styles.commentButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.commentButtonText}>Add Comment</Text>
      </TouchableOpacity>

      <Text style={styles.commentHeader}>Comments</Text>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.commentCard}>
            <Text style={styles.commentUser}>
              @{item.user?.username || item.user}
            </Text>
            <Text style={styles.commentText}>{item.comment}</Text>
          </View>
        )}
      />

      {/* Comment Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add a Comment</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Write your comment..."
              placeholderTextColor="#888"
              value={commentText}
              onChangeText={setCommentText}
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
                onPress={handleAddComment}
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
  container: { flex: 1, backgroundColor: "#000", padding: 20, paddingTop: 60 },
  loadingText: { color: "#A7D129", textAlign: "center", fontSize: 18 },
  username: { color: "#A7D129", fontSize: 18, fontWeight: "700" },
  content: { color: "#FFFFFF", fontSize: 16, marginVertical: 10 },
  meta: { color: "#616F39", fontSize: 12, marginBottom: 20 },
  commentButton: {
    backgroundColor: "#A7D129",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  commentButtonText: { color: "#000", fontWeight: "700", fontSize: 16 },
  commentHeader: {
    color: "#A7D129",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  commentCard: {
    backgroundColor: "#3E432E",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  commentUser: { color: "#A7D129", fontWeight: "600" },
  commentText: { color: "#FFFFFF", marginTop: 4 },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#3E432E",
    padding: 20,
    borderRadius: 12,
    width: "90%",
  },
  modalTitle: {
    color: "#A7D129",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    color: "#000",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
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
});
