/*
  File: app/ChatRoom.tsx
  Purpose: Unimaid Resources — Real Chat Room Screen with Text + Image Messages
  Updated:
  - Single API image sending through send_message.php
  - Expandable image preview
  - Download image support using Expo FileSystem new API
  - Coming soon popup for call / video call / voice record
  - Removed top-left back navigation
  - Swipe reply UI
  - Emoji reactions UI
  - Better avatar fallback handling like profile/avatar_url usage
*/

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
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
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
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";
import { C } from "./constants/theme";

const API_BASE = "https://unresources.cravii.ng/api";
const REACTION_EMOJIS = ["❤️", "👍", "😂", "😮", "🔥", "🙏"];

// ─── ICONS ───────────────────────────────────────────────────────────────────
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

function IconCamera({ color = C.faint }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={1.8} />
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

function IconReply({ color = C.whiteMuted }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 17L4 12l5-5"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 18v-1a5 5 0 0 0-5-5H4"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Msg = {
  id: number | string;
  text?: string;
  imageUrl?: string;
  sent?: boolean;
  time?: string;
  read?: boolean;
  dateSeparator?: string;

  reaction?: string;
  replyToId?: number | string;
  replyToText?: string;
  replyToImage?: string;
  replyToSender?: string;
};

type ChatHeaderUser = {
  avatar_url?: string;
  avatar?: string;
  profile_picture?: string;
  name?: string;
  full_name?: string;
  username?: string;
  initials?: string;
  color?: string;
  online?: string | number;
  userId?: string | number;
  id?: string | number;
};

// ─── COMPONENTS ─────────────────────────────────────────────────────────────
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

function Bubble({
  msg,
  onImagePress,
  onReply,
  onOpenActions,
}: {
  msg: Msg;
  onImagePress: (url: string) => void;
  onReply: (msg: Msg) => void;
  onOpenActions: (msg: Msg) => void;
}) {
  const hasImage = !!msg.imageUrl;
  const hasText = !!msg.text?.trim();
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 12 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_, gesture) => {
          if (gesture.dx > 0) {
            translateX.setValue(Math.min(gesture.dx, 75));
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > 58) {
            onReply(msg);
          }
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        },
      }),
    [msg, onReply, translateX],
  );

  return (
    <View style={[mb.row, msg.sent ? mb.rowSent : mb.rowRecv]}>
      <View style={mb.replyIconGhost}>
        <IconReply color={C.purpleGlow} />
      </View>

      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <Pressable onLongPress={() => onOpenActions(msg)}>
          <View style={[mb.bubble, msg.sent ? mb.bubbleSent : mb.bubbleRecv]}>
            {(msg.replyToText || msg.replyToImage) && (
              <View
                style={[
                  mb.replyPreview,
                  msg.sent ? mb.replyPreviewSent : mb.replyPreviewRecv,
                ]}
              >
                <Text style={mb.replyPreviewTitle}>
                  {msg.replyToSender || "Reply"}
                </Text>

                {msg.replyToImage ? (
                  <View style={mb.replyPreviewImageRow}>
                    <Image
                      source={{ uri: msg.replyToImage }}
                      style={mb.replyThumb}
                      resizeMode="cover"
                    />
                    <Text style={mb.replyPreviewText} numberOfLines={1}>
                      Photo
                    </Text>
                  </View>
                ) : (
                  <Text style={mb.replyPreviewText} numberOfLines={2}>
                    {msg.replyToText}
                  </Text>
                )}
              </View>
            )}

            {hasImage && (
              <Pressable
                onPress={() => msg.imageUrl && onImagePress(msg.imageUrl)}
              >
                <Image
                  source={{ uri: msg.imageUrl }}
                  style={mb.image}
                  resizeMode="cover"
                />
                <View style={mb.imageHintWrap}>
                  <Text style={mb.imageHint}>
                    Tap to expand • Hold for options
                  </Text>
                </View>
              </Pressable>
            )}

            {hasText && (
              <Text
                style={[
                  mb.text,
                  msg.sent ? mb.textSent : mb.textRecv,
                  hasImage ? { paddingTop: 10 } : null,
                ]}
              >
                {msg.text}
              </Text>
            )}

            {!!msg.reaction && (
              <View
                style={[
                  mb.reactionChip,
                  msg.sent ? mb.reactionChipSent : mb.reactionChipRecv,
                ]}
              >
                <Text style={mb.reactionText}>{msg.reaction}</Text>
              </View>
            )}

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
        </Pressable>
      </Animated.View>
    </View>
  );
}

const mb = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  rowSent: { justifyContent: "flex-end" },
  rowRecv: { justifyContent: "flex-start" },
  replyIconGhost: {
    position: "absolute",
    left: 24,
    opacity: 0.9,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    padding: 4,
    overflow: "visible",
  },
  bubbleSent: { backgroundColor: "#5b21b6", borderBottomRightRadius: 5 },
  bubbleRecv: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: C.border,
    borderBottomLeftRadius: 5,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  textSent: { color: "rgba(255,255,255,0.95)" },
  textRecv: { color: "rgba(255,255,255,0.82)" },
  image: {
    width: 240,
    height: 240,
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
    letterSpacing: 0.2,
  },
  replyPreview: {
    marginHorizontal: 6,
    marginTop: 6,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderLeftWidth: 3,
  },
  replyPreviewSent: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderLeftColor: "rgba(255,255,255,0.95)",
  },
  replyPreviewRecv: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderLeftColor: C.purpleGlow,
  },
  replyPreviewTitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 3,
  },
  replyPreviewText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    lineHeight: 16,
  },
  replyPreviewImageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  replyThumb: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  reactionChip: {
    position: "absolute",
    bottom: -12,
    minWidth: 30,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  reactionChipSent: {
    right: 8,
    backgroundColor: "#1a1034",
    borderColor: "rgba(255,255,255,0.12)",
  },
  reactionChipRecv: {
    left: 8,
    backgroundColor: "#13131d",
    borderColor: "rgba(255,255,255,0.12)",
  },
  reactionText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    paddingHorizontal: 8,
    gap: 3,
  },
  time: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
});

// ─── MAIN CHAT ROOM ─────────────────────────────────────────────────────────
export default function ChatRoom() {
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    initials?: string;
    color?: string;
    online?: string;
    userId?: string;
    avatar?: string;
    avatar_url?: string;
    profile_picture?: string;
    user?: string;
  }>();

  const parsedUser = useMemo(() => {
    try {
      if (params.user && typeof params.user === "string") {
        return JSON.parse(params.user) as ChatHeaderUser;
      }
      return null;
    } catch {
      return null;
    }
  }, [params.user]);

  const rawId = params.id ?? "";
  const otherUserId = String(
    params.userId ||
      parsedUser?.userId ||
      parsedUser?.id ||
      (rawId.startsWith("new_") ? rawId.replace("new_", "") : rawId),
  );

  const chatName = (
    params.name ||
    parsedUser?.full_name ||
    parsedUser?.name ||
    parsedUser?.username ||
    "Chat"
  ).toUpperCase();

  const initials = (
    params.initials ||
    parsedUser?.initials ||
    chatName.slice(0, 2) ||
    "?"
  ).toUpperCase();

  const avatarColor = params.color || parsedUser?.color || C.purpleMid;
  const isOnline =
    params.online === "1" ||
    parsedUser?.online === "1" ||
    parsedUser?.online === 1;

  const avatarUrl =
    params.avatar ||
    params.avatar_url ||
    params.profile_picture ||
    parsedUser?.avatar_url ||
    parsedUser?.avatar ||
    parsedUser?.profile_picture ||
    "";

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUsername, setCurrentUsername] = useState("You");
  const [uploading, setUploading] = useState(false);

  const [replyingTo, setReplyingTo] = useState<Msg | null>(null);

  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [comingSoonVisible, setComingSoonVisible] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState("");
  const [comingSoonText, setComingSoonText] = useState("");

  const [messageActionsVisible, setMessageActionsVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Msg | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const hasLoadedInitially = useRef(false);
  const isNearBottomRef = useRef(true);
  const previousMessageCountRef = useRef(0);

  const scrollToEnd = (animated = true) => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated }), 100);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    isNearBottomRef.current =
      contentSize.height - (contentOffset.y + layoutMeasurement.height) < 120;
  };

  const showComingSoon = (title: string, text: string) => {
    setComingSoonTitle(title);
    setComingSoonText(text);
    setComingSoonVisible(true);
  };

  const openImageViewer = (url: string) => {
    setSelectedImage(url);
    setImageViewerVisible(true);
  };

  const downloadImage = async (url: string) => {
    try {
      const uniqueFolder = new Directory(
        Paths.cache,
        "chat-downloads",
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
      console.error("Download image error:", err);
      Alert.alert(
        "Download Failed",
        err?.message || "Could not download image",
      );
    }
  };

  const openMessageActions = (msg: Msg) => {
    setSelectedMessage(msg);
    setMessageActionsVisible(true);
  };

  const closeMessageActions = () => {
    setSelectedMessage(null);
    setMessageActionsVisible(false);
  };

  const applyReaction = async (emoji: string) => {
    if (!selectedMessage) return;

    const messageId = selectedMessage.id;

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, reaction: emoji } : m)),
    );

    closeMessageActions();

    try {
      await fetch(`${API_BASE}/react_message.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: Number(messageId),
          user_id: Number(currentUserId),
          reaction: emoji,
        }),
      });
    } catch (err) {
      console.log("Reaction API not available yet:", err);
    }
  };

  const startReply = (msg: Msg) => {
    setReplyingTo(msg);
  };

  const clearReply = () => {
    setReplyingTo(null);
  };

  useEffect(() => {
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
        setError("Failed to load user");
      } finally {
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

    if (showLoader) setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE}/get_messages.php?id=${encodeURIComponent(otherUserId)}&sender_id=${encodeURIComponent(currentUserId)}&name=${encodeURIComponent(chatName)}`;
      const res = await fetch(url);
      const text = await res.text();
      const data = JSON.parse(text);

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
            imageUrl: msg.image_url || undefined,
            sent: msg.sent,
            time: msg.time,
            read: msg.read,

            reaction: msg.reaction || undefined,
            replyToId: msg.reply_to_id || undefined,
            replyToText: msg.reply_to_text || undefined,
            replyToImage: msg.reply_to_image || undefined,
            replyToSender: msg.reply_to_sender || undefined,
          });
        });

        const previousCount = previousMessageCountRef.current;
        const newCount = msgsWithDates.filter((m) => !m.dateSeparator).length;
        const hasNewMessages = newCount > previousCount;

        setMessages(msgsWithDates);
        previousMessageCountRef.current = newCount;

        if (!hasLoadedInitially.current) {
          hasLoadedInitially.current = true;
          scrollToEnd(false);
        } else if (hasNewMessages && isNearBottomRef.current) {
          scrollToEnd(true);
        }
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

    const interval = setInterval(() => loadMessages(false), 3000);
    return () => clearInterval(interval);
  }, [currentUserId, otherUserId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages(false);
  };

  const sendImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      if (!asset.base64 || !currentUserId || !otherUserId) {
        Alert.alert("Error", "Could not read image");
        return;
      }

      setUploading(true);

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const tempId = `temp_img_${Date.now()}`;
      const localUri = asset.uri;

      setMessages((prev) => {
        const newMessages = [...prev];
        if (!newMessages.some((m) => m.dateSeparator === "Today")) {
          newMessages.push({ id: `sep_${Date.now()}`, dateSeparator: "Today" });
        }
        newMessages.push({
          id: tempId,
          imageUrl: localUri,
          sent: true,
          time: timeStr,
          read: false,
          replyToId: replyingTo?.id,
          replyToText: replyingTo?.text,
          replyToImage: replyingTo?.imageUrl,
          replyToSender: replyingTo?.sent ? currentUsername : chatName,
        });
        return newMessages;
      });

      scrollToEnd();

      const res = await fetch(`${API_BASE}/send_message.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: Number(currentUserId),
          receiver_id: Number(otherUserId),
          message: "",
          image: asset.base64,
          mimeType: asset.mimeType || "image/jpeg",
          extension: asset.uri.split(".").pop()?.toLowerCase() || "jpg",

          reply_to_id: replyingTo?.id || null,
          reply_to_text: replyingTo?.text || "",
          reply_to_image: replyingTo?.imageUrl || "",
        }),
      });

      const text = await res.text();
      console.log("=== SEND IMAGE RAW RESPONSE ===", text);

      const data = JSON.parse(text);

      if (data.status === "success") {
        clearReply();
        loadMessages(false);
      } else {
        Alert.alert("Upload Failed", data.message || "Unknown error");
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      }
    } catch (err: any) {
      console.error("Send image error:", err);
      Alert.alert("Upload Error", err.message || "Network request failed");
    } finally {
      setUploading(false);
    }
  };

  const sendTextMessage = async () => {
    const text = input.trim();
    if (!text || !otherUserId || !currentUserId) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const tempId = `temp_${Date.now()}`;
    const replySnapshot = replyingTo;

    setMessages((prev) => {
      const newMessages = [...prev];
      if (!newMessages.some((m) => m.dateSeparator === "Today")) {
        newMessages.push({ id: `sep_${Date.now()}`, dateSeparator: "Today" });
      }
      newMessages.push({
        id: tempId,
        text,
        sent: true,
        time: timeStr,
        read: false,
        replyToId: replySnapshot?.id,
        replyToText: replySnapshot?.text,
        replyToImage: replySnapshot?.imageUrl,
        replyToSender: replySnapshot?.sent ? currentUsername : chatName,
      });
      return newMessages;
    });

    setInput("");
    clearReply();
    scrollToEnd();

    try {
      const res = await fetch(`${API_BASE}/send_message.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: Number(currentUserId),
          receiver_id: Number(otherUserId),
          message: text,

          reply_to_id: replySnapshot?.id || null,
          reply_to_text: replySnapshot?.text || "",
          reply_to_image: replySnapshot?.imageUrl || "",
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        loadMessages(false);
      } else {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        Alert.alert("Message Failed", data.message || "Could not send message");
      }
    } catch (err) {
      console.error("Send text error:", err);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      Alert.alert("Message Failed", "Network request failed");
    }
  };

  const handleSendOrMic = () => {
    if (input.trim().length > 0) {
      sendTextMessage();
    } else {
      showComingSoon(
        "Voice Record",
        "Voice recording is coming soon. You will be able to record and send voice notes here.",
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
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={[
                  s.headerAvatar,
                  {
                    borderRadius: 13,
                    borderColor: avatarColor + "66",
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
                    backgroundColor: avatarColor + "22",
                    borderColor: avatarColor + "66",
                  },
                ]}
              >
                <Text style={[s.headerAvatarText, { color: avatarColor }]}>
                  {initials}
                </Text>
              </View>
            )}
            {isOnline && <View style={s.onlineDot} />}
          </View>

          <View style={s.headerInfo}>
            <Text style={s.headerName} numberOfLines={1}>
              {chatName}
            </Text>
            <Text
              style={[s.headerSub, { color: isOnline ? C.online : C.faint }]}
              numberOfLines={1}
            >
              {isOnline ? "ONLINE NOW" : "LAST SEEN RECENTLY"}
            </Text>
          </View>

          <View style={s.headerActions}>
            <TouchableOpacity
              style={s.hBtn}
              onPress={() =>
                showComingSoon(
                  "Voice Call",
                  "Voice calling is coming soon. This feature will be available in a future update.",
                )
              }
            >
              <IconPhone />
            </TouchableOpacity>

            <TouchableOpacity
              style={s.hBtn}
              onPress={() =>
                showComingSoon(
                  "Video Call",
                  "Video calling is coming soon. This feature will be available in a future update.",
                )
              }
            >
              <IconVideo />
            </TouchableOpacity>

            <TouchableOpacity
              style={s.hBtn}
              onPress={() =>
                showComingSoon(
                  "More Options",
                  "More chat actions are coming soon. New tools will appear here in a future update.",
                )
              }
            >
              <IconMore />
            </TouchableOpacity>
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
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <React.Fragment key={msg.id}>
              {msg.dateSeparator ? (
                <DateSep label={msg.dateSeparator} />
              ) : (
                <Bubble
                  msg={msg}
                  onImagePress={openImageViewer}
                  onReply={startReply}
                  onOpenActions={openMessageActions}
                />
              )}
            </React.Fragment>
          ))}
          <View style={{ height: 30 }} />
        </ScrollView>

        {replyingTo && (
          <View style={s.replyBarWrap}>
            <View style={s.replyBar}>
              <View style={s.replyBarLine} />
              <View style={{ flex: 1 }}>
                <Text style={s.replyBarTitle}>
                  Replying to {replyingTo.sent ? "yourself" : chatName}
                </Text>

                {replyingTo.imageUrl ? (
                  <View style={s.replyBarImageRow}>
                    <Image
                      source={{ uri: replyingTo.imageUrl }}
                      style={s.replyBarThumb}
                    />
                    <Text style={s.replyBarText} numberOfLines={1}>
                      Photo
                    </Text>
                  </View>
                ) : (
                  <Text style={s.replyBarText} numberOfLines={1}>
                    {replyingTo.text}
                  </Text>
                )}
              </View>

              <TouchableOpacity style={s.replyBarClose} onPress={clearReply}>
                <IconClose color={C.whiteMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View
          style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}
        >
          <TouchableOpacity
            style={s.inputAction}
            onPress={sendImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={C.purpleGlow} />
            ) : (
              <IconCamera color={C.faint} />
            )}
          </TouchableOpacity>

          <TextInput
            style={s.textInput}
            placeholder={replyingTo ? "Send reply..." : "Type a message"}
            placeholderTextColor={C.faint}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[s.sendBtn, input.trim().length > 0 && s.sendBtnActive]}
            onPress={handleSendOrMic}
            activeOpacity={0.8}
          >
            {input.trim().length > 0 ? <IconSend /> : <IconMic />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Image Viewer Modal */}
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

      {/* Message Actions / Reaction Picker */}
      <Modal
        visible={messageActionsVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMessageActions}
      >
        <Pressable style={s.sheetOverlay} onPress={closeMessageActions}>
          <Pressable style={s.sheetCard} onPress={() => {}}>
            <Text style={s.sheetTitle}>Message Actions</Text>

            <View style={s.reactionsRow}>
              {REACTION_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={s.reactionPickerBtn}
                  onPress={() => applyReaction(emoji)}
                >
                  <Text style={s.reactionPickerText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={s.sheetBtn}
              onPress={() => {
                if (selectedMessage) startReply(selectedMessage);
                closeMessageActions();
              }}
            >
              <IconReply color={C.whiteSoft} />
              <Text style={s.sheetBtnText}>Reply to message</Text>
            </TouchableOpacity>

            {!!selectedMessage?.imageUrl && (
              <>
                <TouchableOpacity
                  style={s.sheetBtn}
                  onPress={() => {
                    if (selectedMessage.imageUrl) {
                      openImageViewer(selectedMessage.imageUrl);
                    }
                    closeMessageActions();
                  }}
                >
                  <Text style={s.sheetBtnEmoji}>🖼️</Text>
                  <Text style={s.sheetBtnText}>Expand image</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.sheetBtn}
                  onPress={() => {
                    if (selectedMessage.imageUrl) {
                      downloadImage(selectedMessage.imageUrl);
                    }
                    closeMessageActions();
                  }}
                >
                  <IconDownload color={C.whiteSoft} />
                  <Text style={s.sheetBtnText}>Download image</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={s.sheetCancelBtn}
              onPress={closeMessageActions}
            >
              <Text style={s.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Coming Soon Modal */}
      <Modal
        visible={comingSoonVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setComingSoonVisible(false)}
      >
        <View style={s.popupOverlay}>
          <View style={s.popupCard}>
            <View style={s.popupIconWrap}>
              <View style={s.popupGlow} />
              <Text style={s.popupIconText}>✨</Text>
            </View>

            <Text style={s.popupTitle}>{comingSoonTitle}</Text>
            <Text style={s.popupText}>{comingSoonText}</Text>

            <TouchableOpacity
              style={s.popupBtn}
              onPress={() => setComingSoonVisible(false)}
            >
              <Text style={s.popupBtnText}>OKAY</Text>
            </TouchableOpacity>
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
    minHeight: 62,
  },
  headerAvatarWrap: { position: "relative" },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  headerAvatarText: { fontWeight: "800", fontSize: 15 },
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
  headerInfo: { flex: 1, minWidth: 0, justifyContent: "center" },
  headerName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  headerSub: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headerActions: { flexDirection: "row", gap: 6, flexShrink: 0 },
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

  replyBarWrap: {
    backgroundColor: "#100820",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  replyBar: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 10,
  },
  replyBarLine: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 3,
    backgroundColor: C.purpleGlow,
    marginVertical: 8,
  },
  replyBarTitle: {
    color: C.purpleGlow,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 2,
  },
  replyBarText: {
    color: C.whiteMuted,
    fontSize: 12,
  },
  replyBarImageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  replyBarThumb: {
    width: 26,
    height: 26,
    borderRadius: 8,
  },
  replyBarClose: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

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
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    color: C.white,
    fontSize: 15,
    lineHeight: 20,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
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

  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: "#120A22",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sheetTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
    textAlign: "center",
  },
  reactionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16,
  },
  reactionPickerBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  reactionPickerText: {
    fontSize: 22,
  },
  sheetBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 10,
  },
  sheetBtnEmoji: {
    fontSize: 18,
  },
  sheetBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  sheetCancelBtn: {
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  sheetCancelText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontWeight: "700",
  },

  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(3, 2, 10, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  popupCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: "#130A24",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.35)",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
  },
  popupIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  popupGlow: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(124,58,237,0.18)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.35)",
  },
  popupIconText: {
    fontSize: 30,
  },
  popupTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  popupText: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    textAlign: "center",
  },
  popupBtn: {
    marginTop: 20,
    minWidth: 130,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.purpleMid,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  popupBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
});
