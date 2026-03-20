/*
  File: app/GroupChatRoom.tsx
  Purpose: Unimaid Resources — Group Chat Room
  Features:
  - Load group details from groups.php?action=details
  - Load group messages from group_messages.php?action=list
  - Send text, image and PDF to group_messages.php
  - Sender avatar fallback to initials
  - Expand image preview
  - Open PDF link
  - Create date separators
*/

import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { C } from "./constants/theme";

const API_BASE = "https://unresources.cravii.ng/api";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type GroupMember = {
  id: number | string;
  full_name?: string;
  username?: string;
  avatar?: string;
  initials?: string;
  color?: string;
  role?: string;
};

type GroupInfo = {
  id: number | string;
  name: string;
  description?: string;
  photo?: string;
  created_by?: number | string;
  created_at?: string;
  joined?: boolean;
};

type GroupMessage = {
  id: number | string;
  group_id: number | string;
  sender_id: number | string;
  sender_name?: string;
  sender_username?: string;
  sender_avatar?: string;
  sender_initials?: string;
  sender_color?: string;
  message?: string;
  image_url?: string;
  pdf_url?: string;
  file_name?: string;
  file_type?: "text" | "image" | "pdf";
  time?: string;
  created_at?: string;
  dateSeparator?: string;
  temp?: boolean;
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  const clean = (name || "").trim();
  if (!clean) return "G";
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

function stringToColor(text: string) {
  const colors = [
    "#7C3AED",
    "#2563EB",
    "#059669",
    "#DC2626",
    "#EA580C",
    "#0891B2",
    "#DB2777",
    "#4F46E5",
  ];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function buildMessagesWithDates(messages: GroupMessage[]) {
  const result: GroupMessage[] = [];
  let lastDate: string | null = null;

  messages.forEach((msg) => {
    const raw = msg.created_at ? new Date(msg.created_at) : new Date();
    const dateStr = raw.toLocaleDateString();

    if (dateStr !== lastDate) {
      result.push({
        id: `sep_${dateStr}_${msg.id}`,
        group_id: msg.group_id,
        sender_id: 0,
        dateSeparator:
          dateStr === new Date().toLocaleDateString() ? "Today" : dateStr,
      });
      lastDate = dateStr;
    }

    result.push(msg);
  });

  return result;
}

async function uriToBase64(uri: string) {
  const file = new File(uri);
  const base64 = await file.base64();
  return base64;
}

// ─── ICONS ───────────────────────────────────────────────────────────────────

function IconImage({ color = C.faint }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="3"
        stroke={color}
        strokeWidth={1.8}
      />
      <Circle cx="9" cy="9" r="1.5" fill={color} />
      <Path
        d="M21 16l-5-5-8 8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconFile({ color = C.faint }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v5h5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="9"
        y1="13"
        x2="15"
        y2="13"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="9"
        y1="17"
        x2="13"
        y2="17"
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

function IconDownload({ color = C.white }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v11"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
      <Path
        d="M8 10l4 4 4-4"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 20h16"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconClose({ color = C.white }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M6 6l12 12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconUsers({ color = C.whiteMuted }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={1.8} />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

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
    fontWeight: "700",
    letterSpacing: 0.8,
    color: C.faint,
    textTransform: "uppercase",
  },
});

function MemberAvatar({
  avatar,
  initials,
  color,
  size = 18,
}: {
  avatar?: string;
  initials?: string;
  color?: string;
  size?: number;
}) {
  const avatarColor = color || stringToColor(initials || "U");

  return (
    <View
      style={[
        mb.memberAvatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatarColor,
        },
      ]}
    >
      {avatar ? (
        <Image
          source={{ uri: avatar }}
          style={{ width: "100%", height: "100%", borderRadius: size / 2 }}
        />
      ) : (
        <Text style={[mb.memberAvatarText, { fontSize: size * 0.48 }]}>
          {(initials || "U").slice(0, 1)}
        </Text>
      )}
    </View>
  );
}

function MessageBubble({
  msg,
  currentUserId,
  imageSize,
  onImagePress,
  onPdfPress,
}: {
  msg: GroupMessage;
  currentUserId: string;
  imageSize: number;
  onImagePress: (url: string) => void;
  onPdfPress: (url: string) => void;
}) {
  const isMine = String(msg.sender_id) === String(currentUserId);
  const senderName =
    msg.sender_name || msg.sender_username || `User ${msg.sender_id}`;

  const bubbleColor = isMine ? "#5b21b6" : "rgba(255,255,255,0.06)";
  const borderColor = isMine ? "transparent" : C.border;

  const senderInitials =
    msg.sender_initials ||
    getInitials(msg.sender_name || msg.sender_username || "U");
  const senderColor =
    msg.sender_color ||
    stringToColor(
      msg.sender_name || msg.sender_username || String(msg.sender_id),
    );

  return (
    <View style={[mb.row, isMine ? mb.rowMine : mb.rowOther]}>
      {!isMine && (
        <MemberAvatar
          avatar={msg.sender_avatar}
          initials={senderInitials}
          color={senderColor}
          size={30}
        />
      )}

      <View style={{ maxWidth: "80%" }}>
        {!isMine && (
          <Text style={mb.senderName} numberOfLines={1}>
            {senderName}
          </Text>
        )}

        <View
          style={[
            mb.bubble,
            {
              backgroundColor: bubbleColor,
              borderColor,
              borderBottomRightRadius: isMine ? 5 : 18,
              borderBottomLeftRadius: isMine ? 18 : 5,
            },
          ]}
        >
          {msg.file_type === "image" && msg.image_url ? (
            <Pressable onPress={() => onImagePress(msg.image_url!)}>
              <Image
                source={{ uri: msg.image_url }}
                style={[mb.image, { width: imageSize, height: imageSize }]}
                resizeMode="cover"
              />
              <View style={mb.imageHintWrap}>
                <Text style={mb.imageHint}>Tap to expand</Text>
              </View>
            </Pressable>
          ) : null}

          {msg.file_type === "pdf" && msg.pdf_url ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={mb.pdfCard}
              onPress={() => onPdfPress(msg.pdf_url!)}
            >
              <View style={mb.pdfIconWrap}>
                <IconFile color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={mb.pdfTitle} numberOfLines={1}>
                  {msg.file_name || "Document.pdf"}
                </Text>
                <Text style={mb.pdfSub}>Tap to open PDF</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {msg.message ? (
            <Text
              style={[
                mb.messageText,
                isMine ? mb.messageTextMine : mb.messageTextOther,
                msg.file_type === "image" || msg.file_type === "pdf"
                  ? { paddingTop: 10 }
                  : null,
              ]}
            >
              {msg.message}
            </Text>
          ) : null}

          <View style={mb.footer}>
            <Text style={mb.timeText}>{msg.time}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const mb = StyleSheet.create({
  row: {
    marginBottom: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  rowMine: {
    justifyContent: "flex-end",
  },
  rowOther: {
    justifyContent: "flex-start",
  },
  senderName: {
    color: C.purpleGlow,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    overflow: "hidden",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  messageTextMine: {
    color: "rgba(255,255,255,0.96)",
  },
  messageTextOther: {
    color: "rgba(255,255,255,0.86)",
  },
  image: {
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  imageHintWrap: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  imageHint: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  pdfCard: {
    minWidth: 220,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    margin: 4,
  },
  pdfIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  pdfSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  timeText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  memberAvatar: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    color: "#fff",
    fontWeight: "800",
  },
});

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function GroupChatRoom() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const params = useLocalSearchParams<{
    groupId?: string;
    groupName?: string;
  }>();

  const groupId = String(params.groupId || "");
  const routeGroupName = String(params.groupName || "GROUP");

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUsername, setCurrentUsername] = useState("You");

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const hasLoadedInitially = useRef(false);

  const imageSize = Math.min(Math.max(width * 0.56, 180), 280);

  const groupTitle = (group?.name || routeGroupName).toUpperCase();
  const memberCount = members.length;

  const groupInitials = useMemo(
    () => getInitials(group?.name || routeGroupName),
    [group?.name, routeGroupName],
  );
  const groupColor = useMemo(
    () => stringToColor(group?.name || routeGroupName),
    [group?.name, routeGroupName],
  );

  const scrollToEnd = (animated = true) => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated }), 120);
  };

  const loadCurrentUser = async () => {
    try {
      const storedUserId = await SecureStore.getItemAsync("user_id");
      const storedUser = await SecureStore.getItemAsync("user");

      if (storedUserId) {
        setCurrentUserId(String(storedUserId));
      }

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.id && !storedUserId) {
          setCurrentUserId(String(parsed.id));
          await SecureStore.setItemAsync("user_id", String(parsed.id));
        }
        if (parsed?.username) setCurrentUsername(String(parsed.username));
        if (parsed?.full_name && !parsed?.username) {
          setCurrentUsername(String(parsed.full_name));
        }
      }
    } catch (err) {
      console.log("loadCurrentUser failed:", err);
    }
  };

  const loadGroupDetails = async (userId: string) => {
    if (!groupId || !userId) return;

    try {
      const res = await fetch(
        `${API_BASE}/groups.php?action=details&group_id=${encodeURIComponent(groupId)}&user_id=${encodeURIComponent(userId)}`,
      );
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log("Invalid groups details response:", text);
        return;
      }

      if (data.status === "success") {
        setGroup(data.group || null);
        setMembers(Array.isArray(data.members) ? data.members : []);
      }
    } catch (err) {
      console.log("loadGroupDetails failed:", err);
    }
  };

  const loadMessages = async (showLoader = true) => {
    if (!groupId) return;

    if (showLoader) setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/group_messages.php?action=list&group_id=${encodeURIComponent(groupId)}`,
      );
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log("Invalid group_messages response:", text);
        setError("Invalid server response");
        return;
      }

      if (data.status === "success") {
        const normalized: GroupMessage[] = Array.isArray(data.messages)
          ? data.messages
          : [];

        const withDates = buildMessagesWithDates(normalized);
        setMessages(withDates);

        if (!hasLoadedInitially.current) {
          hasLoadedInitially.current = true;
          scrollToEnd(false);
        }
      } else {
        setError(data.message || "Failed to load messages");
      }
    } catch (err) {
      console.log("loadMessages failed:", err);
      setError("Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadCurrentUser();
    };
    init();
  }, []);

  useEffect(() => {
    if (!currentUserId || !groupId) return;

    const run = async () => {
      await loadGroupDetails(currentUserId);
      await loadMessages(true);
    };

    run();
  }, [currentUserId, groupId]);

  useEffect(() => {
    if (!groupId || !currentUserId) return;

    const interval = setInterval(() => {
      loadMessages(false);
      loadGroupDetails(currentUserId);
    }, 3000);

    return () => clearInterval(interval);
  }, [groupId, currentUserId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages(false);
    loadGroupDetails(currentUserId);
  };

  const sendTextMessage = async () => {
    const text = input.trim();
    if (!text || !groupId || !currentUserId || sending) return;

    const now = new Date();
    const tempId = `temp_${Date.now()}`;

    const tempMsg: GroupMessage = {
      id: tempId,
      group_id: groupId,
      sender_id: currentUserId,
      sender_name: currentUsername,
      sender_username: currentUsername,
      sender_initials: getInitials(currentUsername),
      sender_color: stringToColor(currentUsername),
      message: text,
      file_type: "text",
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      created_at: now.toISOString(),
      temp: true,
    };

    setInput("");
    setSending(true);
    setMessages((prev) =>
      buildMessagesWithDates([
        ...prev.filter((m) => !m.dateSeparator),
        tempMsg,
      ]),
    );
    scrollToEnd();

    try {
      const res = await fetch(`${API_BASE}/group_messages.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          group_id: Number(groupId),
          sender_id: Number(currentUserId),
          message: text,
        }),
      });

      const textRes = await res.text();
      let data;
      try {
        data = JSON.parse(textRes);
      } catch {
        console.log("sendText invalid response:", textRes);
        Alert.alert("Error", "Invalid server response");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }

      if (data.status === "success") {
        loadMessages(false);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        Alert.alert("Error", data.message || "Could not send message");
      }
    } catch (err) {
      console.log("sendText failed:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert("Error", "Network error");
    } finally {
      setSending(false);
    }
  };

  const sendImage = async () => {
    if (!groupId || !currentUserId || sending) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const base64 = await uriToBase64(asset.uri);

      setSending(true);

      const res = await fetch(`${API_BASE}/group_messages.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          group_id: Number(groupId),
          sender_id: Number(currentUserId),
          message: "",
          image: base64,
          extension: asset.uri.split(".").pop()?.toLowerCase() || "jpg",
        }),
      });

      const textRes = await res.text();
      let data;
      try {
        data = JSON.parse(textRes);
      } catch {
        console.log("sendImage invalid response:", textRes);
        Alert.alert("Error", "Invalid server response");
        return;
      }

      if (data.status === "success") {
        loadMessages(false);
        scrollToEnd();
      } else {
        Alert.alert("Error", data.message || "Could not send image");
      }
    } catch (err) {
      console.log("sendImage failed:", err);
      Alert.alert("Error", "Could not send image");
    } finally {
      setSending(false);
    }
  };

  const sendPdf = async () => {
    if (!groupId || !currentUserId || sending) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const base64 = await uriToBase64(asset.uri);

      setSending(true);

      const res = await fetch(`${API_BASE}/group_messages.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          group_id: Number(groupId),
          sender_id: Number(currentUserId),
          message: "",
          pdf: base64,
          file_name: asset.name || "document.pdf",
          extension: "pdf",
        }),
      });

      const textRes = await res.text();
      let data;
      try {
        data = JSON.parse(textRes);
      } catch {
        console.log("sendPdf invalid response:", textRes);
        Alert.alert("Error", "Invalid server response");
        return;
      }

      if (data.status === "success") {
        loadMessages(false);
        scrollToEnd();
      } else {
        Alert.alert("Error", data.message || "Could not send PDF");
      }
    } catch (err) {
      console.log("sendPdf failed:", err);
      Alert.alert("Error", "Could not send PDF");
    } finally {
      setSending(false);
    }
  };

  const openImageViewer = (url: string) => {
    setSelectedImage(url);
    setImageViewerVisible(true);
  };

  const openPdf = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert("Error", "Could not open PDF");
    }
  };

  const downloadImage = async (url: string) => {
    try {
      const uniqueFolder = new Directory(
        Paths.cache,
        "group-downloads",
        `img_${Date.now()}`,
      );

      uniqueFolder.create({ idempotent: true, intermediates: true });
      const downloadedFile = await File.downloadFileAsync(url, uniqueFolder);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadedFile.uri);
      } else {
        await Linking.openURL(downloadedFile.uri);
      }
    } catch (err: any) {
      console.log("downloadImage failed:", err);
      Alert.alert(
        "Download Failed",
        err?.message || "Could not download image",
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ActivityIndicator
          size="large"
          color={C.purpleGlow}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <Text style={{ color: "#f87171", textAlign: "center", marginTop: 100 }}>
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View
        style={[
          s.headerWrap,
          { paddingTop: Platform.OS === "android" ? 2 : 0 },
        ]}
      >
        <View style={s.header}>
          <View style={s.headerAvatarWrap}>
            {group?.photo ? (
              <Image
                source={{ uri: group.photo }}
                style={[
                  s.headerAvatar,
                  {
                    borderColor: groupColor + "55",
                    backgroundColor: C.card,
                  },
                ]}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  s.headerAvatar,
                  {
                    backgroundColor: groupColor + "22",
                    borderColor: groupColor + "66",
                  },
                ]}
              >
                <Text style={[s.headerAvatarText, { color: groupColor }]}>
                  {groupInitials}
                </Text>
              </View>
            )}
          </View>

          <View style={s.headerInfo}>
            <Text style={s.headerName} numberOfLines={1}>
              {groupTitle}
            </Text>
            <View style={s.headerMembersRow}>
              <IconUsers color={C.faint} />
              <Text style={s.headerSub} numberOfLines={1}>
                {memberCount} member{memberCount === 1 ? "" : "s"}
              </Text>
            </View>
          </View>
        </View>
        <View style={s.headerDivider} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={s.list}
          contentContainerStyle={{
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom + 110, 120),
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.purpleGlow}
            />
          }
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <React.Fragment key={String(msg.id)}>
              {msg.dateSeparator ? (
                <DateSep label={msg.dateSeparator} />
              ) : (
                <MessageBubble
                  msg={msg}
                  currentUserId={currentUserId}
                  imageSize={imageSize}
                  onImagePress={openImageViewer}
                  onPdfPress={openPdf}
                />
              )}
            </React.Fragment>
          ))}
          <View style={{ height: 30 }} />
        </ScrollView>

        <View
          style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}
        >
          <TouchableOpacity
            style={s.inputAction}
            onPress={sendImage}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color={C.purpleGlow} />
            ) : (
              <IconImage color={C.faint} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.inputAction}
            onPress={sendPdf}
            disabled={sending}
          >
            <IconFile color={C.faint} />
          </TouchableOpacity>

          <TextInput
            style={s.textInput}
            placeholder="Type a message"
            placeholderTextColor={C.faint}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={700}
          />

          <TouchableOpacity
            style={[s.sendBtn, input.trim().length > 0 && s.sendBtnActive]}
            onPress={sendTextMessage}
            activeOpacity={0.8}
            disabled={sending}
          >
            <IconSend />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={s.viewerOverlay}>
          <View style={[s.viewerTop, { paddingTop: Math.max(insets.top, 16) }]}>
            <TouchableOpacity
              style={s.viewerTopBtn}
              onPress={() => setImageViewerVisible(false)}
            >
              <IconClose />
            </TouchableOpacity>

            <TouchableOpacity
              style={s.viewerTopBtn}
              onPress={() => selectedImage && downloadImage(selectedImage)}
            >
              <IconDownload />
            </TouchableOpacity>
          </View>

          <Pressable
            style={s.viewerBody}
            onPress={() => setImageViewerVisible(false)}
          >
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={s.viewerImage}
                resizeMode="contain"
              />
            ) : null}
          </Pressable>

          <View
            style={[
              s.viewerBottom,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <Text style={s.viewerHint}>
              Tap anywhere to close • Use download to save image
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  headerWrap: { backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 10,
    minHeight: 66,
  },
  headerAvatarWrap: { position: "relative" },
  headerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  headerAvatarText: { fontWeight: "800", fontSize: 15 },
  headerInfo: { flex: 1, minWidth: 0, justifyContent: "center" },
  headerName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headerMembersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: "700",
    color: C.faint,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headerDivider: { height: 1, backgroundColor: C.border },

  list: { flex: 1 },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 10,
    gap: 6,
    backgroundColor: "#100820",
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  inputAction: {
    width: 38,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    color: C.white,
    fontSize: 15,
    lineHeight: 20,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 15,
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

  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
  },
  viewerTop: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewerTopBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  viewerBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  viewerImage: {
    width: "100%",
    height: "82%",
    borderRadius: 18,
  },
  viewerBottom: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  viewerHint: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
