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
import { API_BASE } from "../baseApi";

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");
  const [role, setRole] = useState("patient");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const clearFields = () => {
    setUsername("");
    setEmail("");
    setPhone("");
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

  const storeTokens = async (access: string, refresh: string, role?: string) => {
    try {
      await AsyncStorage.multiSet([
        ["accessToken", access],
        ["refreshToken", refresh],
      ]);
      if (role) await AsyncStorage.setItem("userRole", role);
      Alert.alert("Success", "Login successful!");
    } catch (err) {
      console.error("Error saving tokens", err);
    }
  };

  const login = async () => {
    if (!username || !password) {
      Alert.alert("Missing fields", "Enter username and password");
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
      await storeTokens(data.access, data.refresh, data.role);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      Alert.alert("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const signup = async () => {
    if (!username || !email || !phone || !password) {
      Alert.alert("Missing fields", "Please fill all required fields");
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
          phone,
          password,
          role,
          family_history_skin_cancer: familyHistory,
        }),
      });
      await handleResponseJson(res);
      Alert.alert("Account created", "Please log in now.");
      setMode("login");
      clearFields();
    } catch (err: any) {
      Alert.alert("Signup failed", err.message);
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
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#AEB39A"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#AEB39A"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </>
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
            <>
              <TextInput
                style={styles.input}
                placeholder="Family history of skin cancer (short)"
                placeholderTextColor="#AEB39A"
                value={familyHistory}
                onChangeText={setFamilyHistory}
                multiline
              />

              <View style={styles.roleContainer}>
                {["patient", "doctor"].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleButton,
                      role === r && styles.roleButtonActive,
                    ]}
                    onPress={() => setRole(r)}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        role === r && styles.roleButtonTextActive,
                      ]}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => (mode === "login" ? login() : signup())}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
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
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  roleButton: {
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  roleButtonActive: {
    backgroundColor: colors.accent,
  },
  roleButtonText: {
    color: colors.muted,
    fontWeight: "500",
  },
  roleButtonTextActive: {
    color: "#000",
    fontWeight: "700",
  },
});
