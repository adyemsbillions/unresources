/*
  File: app/ChatRoom.tsx
  Purpose: Unimaid Resources — Chat Room Screen
  Routing: Expo Router (useLocalSearchParams + useRouter)
*/

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
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

// ─── THEME ───────────────────────────────────────────────────────────────────

const C = {
  bg: "#0d0618",
  bgDeep: "#080412",
  card: "rgba(255,255,255,0.055)" as const,
  border: "rgba(255,255,255,0.09)" as const,
  purple: "#6d28d9",
  purpleMid: "#7c3aed",
  purpleGlow: "#a78bfa",
  bubbleSent: "#5b21b6",
  bubbleRecv: "rgba(255,255,255,0.07)" as const,
  white: "#ffffff",
  whiteSoft: "rgba(255,255,255,0.88)" as const,
  whiteMuted: "rgba(255,255,255,0.55)" as const,
  faint: "rgba(255,255,255,0.30)" as const,
  online: "#10d9a0",
  inputBg: "#100820" as const,
};

// ─── SVG ICONS ───────────────────────────────────────────────────────────────

function IconBack({ color = C.whiteSoft }: { color?: string }) {
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

function IconPhone({ color = C.whiteMuted }: { color?: string }) {
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

function IconVideo({ color = C.whiteMuted }: { color?: string }) {
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

function IconMore({ color = C.whiteMuted }: { color?: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="1.3" fill={color} />
      <Circle cx="12" cy="12" r="1.3" fill={color} />
      <Circle cx="12" cy="19" r="1.3" fill={color} />
    </Svg>
  );
}

function IconAttach({ color = C.faint }: { color?: string }) {
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

function IconEmoji({ color = C.faint }: { color?: string }) {
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

function IconMic({ color = C.white }: { color?: string }) {
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

function IconSend({ color = C.white }: { color?: string }) {
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

function IconTick({
  color = C.purpleGlow,
  double = false,
}: {
  color?: string;
  double?: boolean;
}) {
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

// ─── TYPES & MOCK DATA ───────────────────────────────────────────────────────

type Msg = {
  id: number;
  text: string;
  sent: boolean;
  time: string;
  read: boolean;
  dateSeparator?: string;
};

const INITIAL_MESSAGES: Msg[] = [
  {
    id: 1,
    text: "Hey, are you coming to the group study today?",
    sent: false,
    time: "10:12 AM",
    read: true,
    dateSeparator: "Today",
  },
  {
    id: 2,
    text: "Yes! What time are you guys starting?",
    sent: true,
    time: "10:14 AM",
    read: true,
  },
  {
    id: 3,
    text: "We said 2pm at the library, room B4.",
    sent: false,
    time: "10:15 AM",
    read: true,
  },
  {
    id: 4,
    text: "Perfect. I'll bring my notes on data structures.",
    sent: true,
    time: "10:16 AM",
    read: true,
  },
  {
    id: 5,
    text: "Great! Can you also bring the past questions?",
    sent: false,
    time: "10:17 AM",
    read: true,
  },
  {
    id: 6,
    text: "Sure, I have them from 2019 to 2023.",
    sent: true,
    time: "10:20 AM",
    read: true,
  },
  {
    id: 7,
    text: "You're a lifesaver honestly.",
    sent: false,
    time: "10:21 AM",
    read: true,
  },
  {
    id: 8,
    text: "Lol no problem. Has everyone confirmed attendance?",
    sent: true,
    time: "10:22 AM",
    read: true,
  },
  {
    id: 9,
    text: "All 5 of us are coming. Tunde might be a bit late.",
    sent: false,
    time: "10:25 AM",
    read: true,
  },
  {
    id: 10,
    text: "That's fine, we'll start without him.",
    sent: true,
    time: "10:26 AM",
    read: true,
  },
  {
    id: 11,
    text: "Don't forget the assignment deadline tomorrow too!",
    sent: false,
    time: "10:40 AM",
    read: true,
  },
  {
    id: 12,
    text: "I know I know 😅 still on question 4b",
    sent: true,
    time: "10:42 AM",
    read: false,
  },
];

const AUTO_REPLIES = [
  "Got it! See you there.",
  "Sure, no problem at all.",
  "Thanks for the heads up!",
  "Okay, I'll keep that in mind.",
  "Sounds good to me.",
];

// ─── DATE SEPARATOR ──────────────────────────────────────────────────────────

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

// ─── MESSAGE BUBBLE ──────────────────────────────────────────────────────────

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
            <View style={{ marginLeft: 4 }}>
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
  bubbleSent: { backgroundColor: C.bubbleSent, borderBottomRightRadius: 4 },
  bubbleRecv: {
    backgroundColor: C.bubbleRecv,
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

// ─── TYPING INDICATOR ────────────────────────────────────────────────────────

function Typing() {
  return (
    <View style={[mb.row, mb.rowRecv, { paddingBottom: 6 }]}>
      <View style={[mb.bubble, mb.bubbleRecv, { paddingVertical: 13 }]}>
        <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
          <View style={[ty.dot, { opacity: 0.45 }]} />
          <View style={[ty.dot, { opacity: 0.7 }]} />
          <View style={[ty.dot, { opacity: 1.0 }]} />
        </View>
      </View>
    </View>
  );
}

const ty = StyleSheet.create({
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.faint },
});

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function ChatRoom() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    initials: string;
    color: string;
    online: string;
  }>();

  // Fallback values so the screen never crashes if params are missing
  const chatName = params.name ?? "Chat";
  const initials = params.initials ?? "?";
  const avatarColor = params.color ?? "#6d28d9";
  const isOnline = params.online === "1";

  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  // Dismiss the initial typing indicator after ~2.5s
  useEffect(() => {
    const t = setTimeout(() => setTyping(false), 2500);
    return () => clearTimeout(t);
  }, []);

  const scrollToEnd = (animated = true) => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated }), 80);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const now = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text, sent: true, time: now, read: false },
    ]);
    setInput("");
    scrollToEnd();

    // Simulate reply
    setTyping(true);
    const delay = 1800 + Math.random() * 1200;
    setTimeout(() => {
      setTyping(false);
      const reply =
        AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      const replyTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: reply,
          sent: false,
          time: replyTime,
          read: true,
        },
      ]);
      scrollToEnd();
    }, delay);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgDeep} />

      {/* ── HEADER ── */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
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

      {/* ── MESSAGES + INPUT ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          ref={scrollRef}
          style={s.list}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 6 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToEnd(false)}
        >
          {messages.map((msg) => (
            <React.Fragment key={msg.id}>
              {msg.dateSeparator && <DateSep label={msg.dateSeparator} />}
              <Bubble msg={msg} />
            </React.Fragment>
          ))}
          {typing && <Typing />}
          <View style={{ height: 8 }} />
        </ScrollView>

        {/* ── INPUT BAR ── */}
        <View style={s.inputBar}>
          <TouchableOpacity style={s.inputAction}>
            <IconEmoji />
          </TouchableOpacity>

          <TextInput
            style={s.textInput}
            placeholder="Message…"
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

// ─── STYLES ──────────────────────────────────────────────────────────────────

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
    backgroundColor: C.inputBg,
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
    backgroundColor: "rgba(124,58,237,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: {
    backgroundColor: "#7c3aed",
    elevation: 4,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
