import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://192.168.29.232:8000/api";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    const saved = await AsyncStorage.getItem("chatMessages");
    if (saved) setMessages(JSON.parse(saved));
  };

  const saveMessages = async (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    await AsyncStorage.setItem("chatMessages", JSON.stringify(newMessages));
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: "user", text: input };
    const updated = [...messages, userMsg];
    saveMessages(updated);
    setInput("");

    scrollViewRef.current?.scrollToEnd(true);

    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        role: "bot",
        text: data.message || "No response",
      };
      const allMsgs = [...updated, botMsg];
      saveMessages(allMsgs);
      setTimeout(() => scrollViewRef.current?.scrollToEnd(true), 200);
    } catch (error) {
      const errMsg: ChatMessage = { role: "bot", text: "Error reaching server." };
      const allMsgs = [...updated, errMsg];
      saveMessages(allMsgs);
      setTimeout(() => scrollViewRef.current?.scrollToEnd(true), 200);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        innerRef={(ref) => (scrollViewRef.current = ref)}
        contentContainerStyle={styles.chatArea}
        extraScrollHeight={Platform.OS === "ios" ? 40 : 80}
        enableOnAndroid={true}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((item, index) => (
          <View
            key={index}
            style={[
              styles.msgContainer,
              item.role === "user" ? styles.userMsg : styles.botMsg,
            ]}
          >
            <Text style={styles.msgText}>{item.text}</Text>
          </View>
        ))}
      </KeyboardAwareScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask something..."
          placeholderTextColor="#999"
          value={input}
          onChangeText={setInput}
          onFocus={() =>
            setTimeout(() => scrollViewRef.current?.scrollToEnd(true), 200)
          }
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  chatArea: {
    padding: 15,
    paddingBottom: 80,
  },
  msgContainer: {
    maxWidth: "80%",
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
  },
  userMsg: {
    backgroundColor: "#A7D129",
    alignSelf: "flex-end",
  },
  botMsg: {
    backgroundColor: "#1E1E1E",
    alignSelf: "flex-start",
  },
  msgText: {
    color: "#FFF",
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: "#111",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#222",
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: "#FFF",
    backgroundColor: "#1C1C1C",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: "#A7D129",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginLeft: 10,
    height: 30,
    justifyContent: "center",
  },
  sendText: {
    color: "#000",
    fontWeight: "700",
  },
});
