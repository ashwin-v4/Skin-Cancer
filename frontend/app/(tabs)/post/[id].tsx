import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Alert, TextInput, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {API_BASE} from "../../../baseApi"

export default function PostDetail() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
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
    if (!commentText.trim()) return Alert.alert("Empty", "Enter a comment");
    try {
      const token = await AsyncStorage.getItem("accessToken");
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
      fetchPost(); // reload comments
    } catch (err) {
      console.error("Error posting comment:", err);
      Alert.alert("Error", "Failed to send comment");
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
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/home")}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.username}>@{post.user?.username || post.user}</Text>
      <Text style={styles.content}>{post.content}</Text>
      <Text style={styles.meta}>{new Date(post.created_at).toLocaleString()}</Text>

      <Text style={styles.commentHeader}>Comments</Text>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.commentCard}>
            <Text style={styles.commentUser}>@{item.user?.username || item.user}</Text>
            <Text style={styles.commentText}>{item.comment}</Text>
          </View>
        )}
      />

      {/* Comment Input */}
      <View style={styles.commentInputBox}>
        <TextInput
          placeholder="Write a comment..."
          placeholderTextColor="#999"
          value={commentText}
          onChangeText={setCommentText}
          style={styles.commentInput}
        />
        <TouchableOpacity style={styles.commentButton} onPress={handleAddComment}>
          <Text style={styles.commentButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000", padding: 20, paddingTop: 60 },
  loadingText: { color: "#A7D129", textAlign: "center", fontSize: 18 },
  backButton: { marginBottom: 15 },
  backText: { color: "#A7D129", fontSize: 18, fontWeight: "700" },
  username: { color: "#A7D129", fontSize: 18, fontWeight: "700" },
  content: { color: "#FFFFFF", fontSize: 16, marginVertical: 10 },
  meta: { color: "#616F39", fontSize: 12 },
  commentHeader: { color: "#A7D129", fontSize: 20, fontWeight: "600", marginTop: 25 },
  commentCard: { backgroundColor: "#3E432E", padding: 10, borderRadius: 8, marginTop: 10 },
  commentUser: { color: "#A7D129", fontWeight: "600" },
  commentText: { color: "#FFFFFF", marginTop: 4 },
  commentInputBox: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  commentInput: {
    flex: 1,
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
  },
  commentButton: {
    backgroundColor: "#A7D129",
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  commentButtonText: { color: "#000", fontWeight: "700" },
});
