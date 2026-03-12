/*
  File: app/ChatRoom.tsx
  Purpose: Unimaid Resources — Real Chat Room Screen with DB Messages
*/

import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";
import { C } from "./constants/theme";

const API_BASE = "https://unresources.cravii.ng/api";

function IconBack({ color = C.whiteSoft }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconPhone({ color = C.whiteMuted }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconVideo({ color = C.whiteMuted }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="23 7 16 12 23 17 23 7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x="1"
        y="5"
        width="15"
        height="14"
        rx="2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconMore({ color = C.whiteMuted }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="1.3" fill={color} />
      <Circle cx="12" cy="12" r="1.3" fill={color} />
      <Circle cx="12" cy="19" r="1.3" fill={color} />
    </Svg>
  );
}

function IconAttach({ color = C.faint }) {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconEmoji({ color = C.faint }) {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path
        d="M8 14s1.5 2 4 2 4-2 4-2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="9"
        y1="9"
        x2="9.01"
        y2="9"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Line
        x1="15"
        y1="9"
        x2="15.01"
        y2="9"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconMic({ color = C.white }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Rect
        x="9"
        y="2"
        width="6"
        height="11"
        rx="3"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M5 10a7 7 0 0 0 14 0"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="12"
        y1="19"
        x2="12"
        y2="23"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="8"
        y1="23"
        x2="16"
        y2="23"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconSend({ color = C.white }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 2L15 22l-4-9-9-4 20-7z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconTick({ color = C.purpleGlow, double = false }) {
  return (
    <Svg width={double ? 18 : 13} height={10} viewBox="0 0 22 12" fill="none">
      <Path
        d="M1 6l4 4L13 2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {double && (
        <Path
          d="M7 6l4 4 8-8"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

type Msg = {
  id: number | string;
  text?: string;
  sent?: boolean;
  time?: string;
  read?: boolean;
  dateSeparator?: string;
};

function DateSep({ label }: { label: string }) {
  return (
    <View style={ds.wrap}>
      <View style={ds.line} />
      <Text style={ds.text}>{label}</Text>
      <View style={ds.line} />
    </View>
  );
}

const ds = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  text: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: C.faint,
  },
});

function Bubble({ msg }: { msg: Msg }) {
  return (
    <View style={[mb.row, msg.sent ? mb.rowSent : mb.rowRecv]}>
      <View style={[mb.bubble, msg.sent ? mb.bubbleSent : mb.bubbleRecv]}>
        <Text style={[mb.text, msg.sent ? mb.textSent : mb.textRecv]}>
          {msg.text}
        </Text>
        <View style={mb.footer}>
          <Text style={mb.time}>{msg.time}</Text>
          {msg.sent && (
            <View style={{ marginLeft: 3 }}>
              <IconTick
                color={msg.read ? C.purpleGlow : C.faint}
                double={msg.read}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const mb = StyleSheet.create({
  row: { flexDirection: "row", marginBottom: 3, paddingHorizontal: 14 },
  rowSent: { justifyContent: "flex-end" },
  rowRecv: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  bubbleSent: { backgroundColor: "#5b21b6", borderBottomRightRadius: 4 },
  bubbleRecv: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: C.border,
    borderBottomLeftRadius: 4,
  },
  text: { fontSize: 15, lineHeight: 21 },
  textSent: { color: "rgba(255,255,255,0.93)" },
  textRecv: { color: "rgba(255,255,255,0.80)" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 5,
    gap: 3,
  },
  time: { fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: "500" },
});

export default function ChatRoom() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    initials?: string;
    color?: string;
    online?: string;
    userId?: string;
    isNew?: string;
  }>();

  const rawId = params.id ?? "";
  const otherUserId = String(
    params.userId ||
      (rawId.startsWith("new_") ? rawId.replace("new_", "") : rawId),
  );

  const chatName = params.name ?? "Chat";
  const initials = params.initials ?? "?";
  const avatarColor = params.color ?? C.purpleMid;
  const isOnline = params.online === "1";

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");

  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = (animated = true) => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const storedUserId = await SecureStore.getItemAsync("user_id");
        const storedUser = await SecureStore.getItemAsync("user");

        console.log("Stored user_id:", storedUserId);
        console.log("Stored user:", storedUser);
        console.log("ChatRoom params:", params);
        console.log("Resolved otherUserId:", otherUserId);

        if (storedUserId && storedUserId.trim() !== "") {
          setCurrentUserId(String(storedUserId));
          return;
        }

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser?.id) {
            setCurrentUserId(String(parsedUser.id));
            await SecureStore.setItemAsync("user_id", String(parsedUser.id));
            return;
          }
        }

        setError("No logged-in user found");
        setLoading(false);
      } catch (err) {
        console.log("Error loading current user:", err);
        setError("Failed to load current user");
        setLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  const loadMessages = async (showLoader = true) => {
    if (!otherUserId || !currentUserId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (showLoader) {
      setLoading(true);
    }

    setError(null);

    try {
      const url = `${API_BASE}/get_messages.php?id=${encodeURIComponent(
        otherUserId,
      )}&sender_id=${encodeURIComponent(currentUserId)}&name=${encodeURIComponent(
        chatName,
      )}`;

      console.log("Loading chat URL:", url);

      const res = await fetch(url);
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log("Raw server response:", text);
        throw new Error("Invalid response from server");
      }

      if (data.status === "success") {
        const msgsWithDates: Msg[] = [];
        let lastDate: string | null = null;

        (data.messages || []).forEach((msg: any) => {
          const msgDate = new Date(msg.created_at).toLocaleDateString();

          if (msgDate !== lastDate) {
            msgsWithDates.push({
              id: `sep_${msgDate}`,
              dateSeparator:
                msgDate === new Date().toLocaleDateString() ? "Today" : msgDate,
            });
            lastDate = msgDate;
          }

          msgsWithDates.push({
            id: msg.id,
            text: msg.text,
            sent: msg.sent,
            time: msg.time,
            read: msg.read,
          });
        });

        setMessages(msgsWithDates);
        scrollToEnd(false);
      } else {
        setError(data.message || "Failed to load messages");
      }
    } catch (err) {
      console.error("Load messages error:", err);
      setError("Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUserId && otherUserId) {
      loadMessages(true);
    }
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const interval = setInterval(() => {
      loadMessages(false);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUserId, otherUserId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !otherUserId || !currentUserId) return;

    const now = new Date();
    const todayLabel = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((prev) => {
      const newMessages = [...prev];

      const hasTodaySeparator = newMessages.some(
        (item) => item.dateSeparator === "Today",
      );

      if (!hasTodaySeparator) {
        newMessages.push({
          id: `sep_${todayLabel}`,
          dateSeparator: "Today",
        });
      }

      newMessages.push({
        id: `temp_${Date.now()}`,
        text,
        sent: true,
        time: timeStr,
        read: false,
      });

      return newMessages;
    });

    setInput("");
    scrollToEnd();

    try {
      console.log("Sending message:", {
        sender_id: currentUserId,
        receiver_id: otherUserId,
        message: text,
      });

      const res = await fetch(`${API_BASE}/send_message.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: Number(currentUserId),
          receiver_id: Number(otherUserId),
          message: text,
        }),
      });

      const responseText = await res.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.log("Raw send response:", responseText);
        throw new Error("Invalid response from server");
      }

      if (data.status !== "success") {
        console.error("Send failed:", data);
        setError(data.message || "Failed to send message");
      } else {
        loadMessages(false);
      }
    } catch (err) {
      console.error("Send error:", err);
      setError("Failed to send message");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator
          size="large"
          color={C.purpleGlow}
          style={{ flex: 1, justifyContent: "center" }}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.safe}>
        <Text style={{ color: "#f87171", textAlign: "center", marginTop: 100 }}>
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgDeep} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <IconBack />
        </TouchableOpacity>

        <View style={s.headerAvatarWrap}>
          <View style={[s.headerAvatar, { backgroundColor: avatarColor }]}>
            <Text style={s.headerAvatarText}>{initials}</Text>
          </View>
          {isOnline && <View style={s.onlineDot} />}
        </View>

        <View style={s.headerInfo}>
          <Text style={s.headerName} numberOfLines={1}>
            {chatName}
          </Text>
          <Text style={[s.headerSub, { color: isOnline ? C.online : C.faint }]}>
            {isOnline ? "Online now" : "Last seen recently"}
          </Text>
        </View>

        <View style={s.headerActions}>
          <TouchableOpacity style={s.hBtn}>
            <IconPhone />
          </TouchableOpacity>
          <TouchableOpacity style={s.hBtn}>
            <IconVideo />
          </TouchableOpacity>
          <TouchableOpacity style={s.hBtn}>
            <IconMore />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.headerDivider} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          ref={scrollRef}
          style={s.list}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.purpleGlow}
            />
          }
        >
          {messages.map((msg) => (
            <React.Fragment key={msg.id}>
              {msg.dateSeparator ? (
                <DateSep label={msg.dateSeparator} />
              ) : (
                <Bubble msg={msg} />
              )}
            </React.Fragment>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={s.inputBar}>
          <TouchableOpacity style={s.inputAction}>
            <IconEmoji />
          </TouchableOpacity>

          <TextInput
            style={s.textInput}
            placeholder="Message..."
            placeholderTextColor={C.faint}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />

          <TouchableOpacity style={s.inputAction}>
            <IconAttach />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.sendBtn, input.trim().length > 0 && s.sendBtnActive]}
            onPress={sendMessage}
            activeOpacity={0.8}
          >
            {input.trim().length > 0 ? <IconSend /> : <IconMic />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarWrap: { position: "relative" },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: { color: C.white, fontWeight: "700", fontSize: 15 },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: C.online,
    borderWidth: 2,
    borderColor: C.bg,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: "700", color: C.white },
  headerSub: { fontSize: 12, fontWeight: "500", marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 6 },
  hBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  headerDivider: { height: 1, backgroundColor: C.border },

  list: { flex: 1 },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: "#100820",
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  inputAction: {
    width: 38,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    color: C.white,
    fontSize: 15,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(124,58,237,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: {
    backgroundColor: C.purpleMid,
    elevation: 4,
    shadowColor: C.purpleMid,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
