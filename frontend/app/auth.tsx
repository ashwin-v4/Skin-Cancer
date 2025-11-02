import React, { useState } from "react";
import { useRouter } from "expo-router";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://192.168.29.232:8000/api";

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();


  const clearFields = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setFamilyHistory("");
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    clearFields();
  };

  const handleResponseJson = async (res: Response) => {
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = json && json.detail ? json.detail : json || "Server error";
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    return json;
  };

  // ✅ Save tokens securely
  const storeTokens = async (access: string, refresh: string) => {
    try {
      await AsyncStorage.setItem("accessToken", access);
      await AsyncStorage.setItem("refreshToken", refresh);
      Alert.alert("Success", "Tokens stored successfully!");
    } catch (err) {
      console.error("Error saving tokens", err);
    }
  };

  const login = async () => {
  if (!username || !password) {
    Alert.alert("Fill required", "Please enter username and password");
    return;
  }
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponseJson(res);

    await storeTokens(data.access, data.refresh);


    clearFields();

    // ✅ Redirect to home page
    router.replace("/(tabs)/home");
  } catch (err: any) {
    Alert.alert("Login failed", err.message || "Unknown error");
  } finally {
    setLoading(false);
  }
};


const signup = async () => {
  if (!username || !email || !password) {
    Alert.alert("Fill required", "Please enter username, email and password");
    return;
  }
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/signup/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password,
        family_history_skin_cancer: familyHistory,
      }),
    });
    const data = await handleResponseJson(res);

    // ✅ If signup succeeded, get tokens immediately
    if (data.access && data.refresh) {
      await storeTokens(data.access, data.refresh);
      clearFields();

      // ✅ Redirect to home page
      router.replace("/(tabs)/home");
    } else {
      Alert.alert("Signed up", "Account created! Please log in now.");
      setMode("login");
      clearFields();
    }
  } catch (err: any) {
    Alert.alert("Signup failed", err.message || "Unknown error");
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {mode === "login" ? "Login" : "Sign Up"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#AEB39A"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          {mode === "signup" && (
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#AEB39A"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#AEB39A"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {mode === "signup" && (
            <TextInput
              style={styles.input}
              placeholder="Family history of skin cancer (short)"
              placeholderTextColor="#AEB39A"
              value={familyHistory}
              onChangeText={setFamilyHistory}
              multiline
            />
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => (mode === "login" ? login() : signup())}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === "login" ? "Log in" : "Create account"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={toggleMode}>
            <Text style={styles.linkText}>
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Have an account? Log in"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const colors = {
  bg: "#000000",
  card: "#3E432E",
  secondary: "#616F39",
  accent: "#A7D129",
  muted: "#AEB39A",
};

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    elevation: 6,
  },
  title: {
    fontSize: 28,
    color: colors.accent,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.25)",
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  primaryButtonText: {
    color: "#000000",
    fontWeight: "700",
    fontSize: 16,
  },
  linkButton: { marginTop: 12, alignItems: "center" },
  linkText: { color: colors.secondary, fontSize: 14 },
});
