import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://192.168.29.232:8000/api";

export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  let accessToken = await AsyncStorage.getItem("accessToken");
  const refreshToken = await AsyncStorage.getItem("refreshToken");

  // add Authorization header
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  let res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  // if access token expired
  if (res.status === 401 && refreshToken) {
    console.warn("Access token expired. Trying to refresh...");
    const refreshRes = await fetch(`${API_BASE}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await refreshRes.json();

    if (refreshRes.ok && data.access) {
      await AsyncStorage.setItem("accessToken", data.access);
      accessToken = data.access;

      // retry the original request with new token
      const retryHeaders = {
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };
      res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers: retryHeaders });
    } else {
      console.error("Refresh token failed. Logging out.");
      await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
      throw new Error("Session expired. Please log in again.");
    }
  }

  return res;
};
