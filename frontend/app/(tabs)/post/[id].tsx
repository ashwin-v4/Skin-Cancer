import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";

const API_BASE = "http://192.168.29.232:8000/api";

export default function PostDetail() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
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
      <Text style={styles.username}>
  @{post.user?.username || post.user}
</Text>

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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000", padding: 20, paddingTop: 60 },
  loadingText: { color: "#A7D129", textAlign: "center", fontSize: 18 },
  username: { color: "#A7D129", fontSize: 18, fontWeight: "700" },
  content: { color: "#FFFFFF", fontSize: 16, marginVertical: 10 },
  meta: { color: "#616F39", fontSize: 12 },
  commentHeader: { color: "#A7D129", fontSize: 20, fontWeight: "600", marginTop: 25 },
  commentCard: { backgroundColor: "#3E432E", padding: 10, borderRadius: 8, marginTop: 10 },
  commentUser: { color: "#A7D129", fontWeight: "600" },
  commentText: { color: "#FFFFFF", marginTop: 4 },
});
