/*
  File: app/ChatRoom.tsx
  Purpose: Unimaid Resources — Premium Chat Room Screen
  Design: Refined dark glass aesthetic with improved responsiveness,
          better bubble layouts, animated input bar, and polished modals.
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
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

const API_BASE = "https://unresources.cravii.ng/api";
const REACTION_EMOJIS = ["❤️", "👍", "😂", "😮", "🔥", "🙏"];

// ─── HELPERS ────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  const clean = (name || "").trim();
  if (!clean) return "U";
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
function IconPhone({ color = "rgba(255,255,255,0.7)" }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.86a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconVideo({ color = "rgba(255,255,255,0.7)" }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="23 7 16 12 23 17 23 7"
        stroke={color}
        strokeWidth={1.7}
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
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconMore({ color = "rgba(255,255,255,0.7)" }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="1.4" fill={color} />
      <Circle cx="12" cy="12" r="1.4" fill={color} />
      <Circle cx="12" cy="19" r="1.4" fill={color} />
    </Svg>
  );
}

function IconCamera({ color = "rgba(255,255,255,0.45)" }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

function IconMic({ color = "#fff" }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect
        x="9"
        y="2"
        width="6"
        height="11"
        rx="3"
        stroke={color}
        strokeWidth={1.7}
      />
      <Path
        d="M5 10a7 7 0 0 0 14 0"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Line
        x1="12"
        y1="19"
        x2="12"
        y2="23"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Line
        x1="8"
        y1="23"
        x2="16"
        y2="23"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconSend({ color = "#fff" }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
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

function IconTick({ color = "#a78bfa", double = false }) {
  return (
    <Svg width={double ? 17 : 12} height={9} viewBox="0 0 22 12" fill="none">
      <Path
        d="M1 6l4 4L13 2"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {double && (
        <Path
          d="M7 6l4 4 8-8"
          stroke={color}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

function IconDownload({ color = "#fff" }) {
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

function IconClose({ color = "#fff" }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

function IconReply({ color = "rgba(255,255,255,0.5)" }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
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

function IconChevronLeft({ color = "#fff" }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={color}
        strokeWidth={2}
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

type PersonApi = {
  id: number | string;
  username?: string;
  full_name?: string;
  initials?: string;
  color?: string;
  avatar?: string;
};

// ─── DATE SEPARATOR ──────────────────────────────────────────────────────────
function DateSep({ label }: { label: string }) {
  return (
    <View style={ds.wrap}>
      <View style={ds.line} />
      <View style={ds.pill}>
        <Text style={ds.text}>{label}</Text>
      </View>
      <View style={ds.line} />
    </View>
  );
}

const ds = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  line: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.07)" },
  pill: {
    marginHorizontal: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.45)",
  },
});

// ─── BUBBLE ──────────────────────────────────────────────────────────────────
function Bubble({
  msg,
  onImagePress,
  onReply,
  onOpenActions,
  imageSize,
}: {
  msg: Msg;
  onImagePress: (url: string) => void;
  onReply: (msg: Msg) => void;
  onOpenActions: (msg: Msg) => void;
  imageSize: number;
}) {
  const hasImage = !!msg.imageUrl;
  const hasText = !!msg.text?.trim();
  const translateX = useRef(new Animated.Value(0)).current;
  const replyOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 10 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_, gesture) => {
          if (gesture.dx > 0) {
            const val = Math.min(gesture.dx, 70);
            translateX.setValue(val);
            replyOpacity.setValue(val / 70);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > 55) onReply(msg);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 8,
          }).start();
          Animated.timing(replyOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          Animated.timing(replyOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        },
      }),
    [msg, onReply, translateX, replyOpacity],
  );

  return (
    <View style={[mb.row, msg.sent ? mb.rowSent : mb.rowRecv]}>
      {/* Swipe reply icon */}
      <Animated.View
        style={[
          mb.replyIconGhost,
          {
            opacity: replyOpacity,
            left: msg.sent ? undefined : 8,
            right: msg.sent ? 8 : undefined,
          },
        ]}
      >
        <View style={mb.replyIconBadge}>
          <IconReply color="#a78bfa" />
        </View>
      </Animated.View>

      <Animated.View
        style={{ transform: [{ translateX }], maxWidth: "78%" }}
        {...panResponder.panHandlers}
      >
        <Pressable onLongPress={() => onOpenActions(msg)} delayLongPress={300}>
          <View style={[mb.bubble, msg.sent ? mb.bubbleSent : mb.bubbleRecv]}>
            {/* Reply preview */}
            {(msg.replyToText || msg.replyToImage) && (
              <View
                style={[
                  mb.replyPreview,
                  msg.sent ? mb.replyPreviewSent : mb.replyPreviewRecv,
                ]}
              >
                <Text
                  style={[
                    mb.replyPreviewTitle,
                    msg.sent
                      ? { color: "rgba(255,255,255,0.9)" }
                      : { color: "#a78bfa" },
                  ]}
                >
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
                      📷 Photo
                    </Text>
                  </View>
                ) : (
                  <Text style={mb.replyPreviewText} numberOfLines={2}>
                    {msg.replyToText}
                  </Text>
                )}
              </View>
            )}

            {/* Image */}
            {hasImage && (
              <Pressable
                onPress={() => msg.imageUrl && onImagePress(msg.imageUrl)}
              >
                <Image
                  source={{ uri: msg.imageUrl }}
                  style={[
                    mb.image,
                    { width: imageSize, height: imageSize * 0.75 },
                  ]}
                  resizeMode="cover"
                />
                <View style={mb.imageOverlay}>
                  <View style={mb.imageHintPill}>
                    <Text style={mb.imageHint}>Tap to expand</Text>
                  </View>
                </View>
              </Pressable>
            )}

            {/* Text */}
            {hasText && (
              <Text
                style={[
                  mb.text,
                  msg.sent ? mb.textSent : mb.textRecv,
                  hasImage && { paddingTop: 8 },
                ]}
              >
                {msg.text}
              </Text>
            )}

            {/* Footer */}
            <View style={[mb.footer, msg.sent ? mb.footerSent : mb.footerRecv]}>
              <Text style={mb.time}>{msg.time}</Text>
              {msg.sent && (
                <View style={{ marginLeft: 3, marginBottom: 1 }}>
                  <IconTick
                    color={msg.read ? "#a78bfa" : "rgba(255,255,255,0.3)"}
                    double={msg.read}
                  />
                </View>
              )}
            </View>
          </View>
        </Pressable>

        {/* Reaction chip */}
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
      </Animated.View>
    </View>
  );
}

const mb = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: 6,
    paddingHorizontal: 12,
    alignItems: "flex-end",
  },
  rowSent: { justifyContent: "flex-end" },
  rowRecv: { justifyContent: "flex-start" },
  replyIconGhost: {
    position: "absolute",
    bottom: 12,
    zIndex: 0,
  },
  replyIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(167,139,250,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  bubble: {
    borderRadius: 20,
    overflow: "hidden",
  },
  bubbleSent: {
    backgroundColor: "#5b21b6",
    borderBottomRightRadius: 5,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bubbleRecv: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderBottomLeftRadius: 5,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textSent: { color: "rgba(255,255,255,0.95)" },
  textRecv: { color: "rgba(255,255,255,0.85)" },
  image: {
    borderRadius: 0,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 38,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageHintPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  imageHint: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  replyPreview: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderLeftWidth: 3,
  },
  replyPreviewSent: {
    backgroundColor: "rgba(0,0,0,0.18)",
    borderLeftColor: "rgba(255,255,255,0.8)",
  },
  replyPreviewRecv: {
    backgroundColor: "rgba(167,139,250,0.08)",
    borderLeftColor: "#a78bfa",
  },
  replyPreviewTitle: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  replyPreviewText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    lineHeight: 16,
  },
  replyPreviewImageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  replyThumb: {
    width: 26,
    height: 26,
    borderRadius: 6,
  },
  reactionChip: {
    position: "absolute",
    bottom: -13,
    minWidth: 32,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#1a0f35",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  reactionChipSent: { right: 6 },
  reactionChipRecv: { left: 6 },
  reactionText: { fontSize: 14 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 7,
    paddingTop: 2,
    gap: 4,
  },
  footerSent: { justifyContent: "flex-end" },
  footerRecv: { justifyContent: "flex-start" },
  time: {
    fontSize: 10,
    color: "rgba(255,255,255,0.38)",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});

// ─── TYPING INDICATOR ────────────────────────────────────────────────────────
function TypingDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: -6,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={{
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: "rgba(255,255,255,0.45)",
        transform: [{ translateY: anim }],
      }}
    />
  );
}

// ─── MAIN CHAT ROOM ──────────────────────────────────────────────────────────
export default function ChatRoom() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

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
      if (params.user && typeof params.user === "string")
        return JSON.parse(params.user) as ChatHeaderUser;
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

  const rawChatName =
    params.name ||
    parsedUser?.full_name ||
    parsedUser?.name ||
    parsedUser?.username ||
    "Chat";
  const chatName = rawChatName.toUpperCase();
  const initials = (
    params.initials ||
    parsedUser?.initials ||
    getInitials(rawChatName)
  ).toUpperCase();
  const avatarColor = params.color || parsedUser?.color || "#7c3aed";
  const isOnline =
    params.online === "1" ||
    parsedUser?.online === "1" ||
    parsedUser?.online === 1;

  const passedAvatarUrl =
    params.avatar ||
    params.avatar_url ||
    params.profile_picture ||
    parsedUser?.avatar_url ||
    parsedUser?.avatar ||
    parsedUser?.profile_picture ||
    "";

  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState(passedAvatarUrl);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
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
  const [inputFocused, setInputFocused] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const hasLoadedInitially = useRef(false);
  const isNearBottomRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const inputBarAnim = useRef(new Animated.Value(0)).current;
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const bubbleImageSize = Math.min(Math.max(width * 0.62, 180), 300);

  const scrollToEnd = (animated = true) => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated }), 80);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    isNearBottomRef.current =
      contentSize.height - (contentOffset.y + layoutMeasurement.height) < 140;
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
    } catch {}
  };

  const startReply = (msg: Msg) => setReplyingTo(msg);
  const clearReply = () => setReplyingTo(null);

  const handleInputFocus = () => {
    setInputFocused(true);
    Animated.timing(inputBarAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleInputBlur = () => {
    setInputFocused(false);
    Animated.timing(inputBarAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const storedUserId = await SecureStore.getItemAsync("user_id");
        const storedUser = await SecureStore.getItemAsync("user");
        if (storedUserId) setCurrentUserId(String(storedUserId));
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.id && !storedUserId) {
            setCurrentUserId(String(parsed.id));
            await SecureStore.setItemAsync("user_id", String(parsed.id));
          }
          if (parsed?.username) setCurrentUsername(String(parsed.username));
          else if (parsed?.full_name)
            setCurrentUsername(String(parsed.full_name));
        }
      } catch {
        setError("Failed to load user");
      } finally {
        setLoading(false);
      }
    };
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (passedAvatarUrl) {
      setResolvedAvatarUrl(passedAvatarUrl);
      return;
    }
    if (!otherUserId) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/get_people.php`);
        const data = JSON.parse(await res.text());
        if (data.status === "success" && Array.isArray(data.users)) {
          const matched = (data.users as PersonApi[]).find(
            (u) => String(u.id) === String(otherUserId),
          );
          if (matched?.avatar) setResolvedAvatarUrl(matched.avatar);
        }
      } catch {}
    })();
  }, [otherUserId, passedAvatarUrl]);

  const getLatestMessageId = useMemo(() => {
    const realMsgs = messages.filter((m) => typeof m.id === "number");
    if (realMsgs.length === 0) return null;
    return Math.max(...realMsgs.map((m) => Number(m.id)));
  }, [messages]);

  const loadMessages = async (isBackground = false) => {
    if (!otherUserId || !currentUserId) return;

    if (!isBackground) setLoading(true);
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

        const prevCount = previousMessageCountRef.current;
        const newCount = msgsWithDates.filter((m) => !m.dateSeparator).length;

        // Only update state if something actually changed
        if (
          newCount !== prevCount ||
          getLatestMessageId !== getLatestMessageId
        ) {
          setMessages(msgsWithDates);
          previousMessageCountRef.current = newCount;

          if (!hasLoadedInitially.current) {
            hasLoadedInitially.current = true;
            scrollToEnd(false);
          } else if (newCount > prevCount && isNearBottomRef.current) {
            scrollToEnd(true);
          }
        }
      } else {
        if (!isBackground) setError(data.message || "Failed to load messages");
      }
    } catch (err) {
      if (!isBackground) setError("Network error");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (currentUserId && otherUserId) {
      loadMessages(false);
    }
  }, [currentUserId, otherUserId]);

  // Hidden background polling (~every 2.3 seconds)
  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    // Clean up previous interval if exists
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(() => {
      loadMessages(true); // background mode → no UI loading state
    }, 2300);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [currentUserId, otherUserId]);

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
      const tempId = `temp_img_${Date.now()}`;
      setMessages((prev) => {
        const msgs = [...prev];
        if (!msgs.some((m) => m.dateSeparator === "Today"))
          msgs.push({ id: `sep_${Date.now()}`, dateSeparator: "Today" });
        msgs.push({
          id: tempId,
          imageUrl: asset.uri,
          sent: true,
          time: formatTime(new Date()),
          read: false,
          replyToId: replyingTo?.id,
          replyToText: replyingTo?.text,
          replyToImage: replyingTo?.imageUrl,
          replyToSender: replyingTo?.sent ? currentUsername : chatName,
        });
        return msgs;
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
      const data = JSON.parse(await res.text());
      if (data.status === "success") {
        clearReply();
        loadMessages(false);
      } else {
        Alert.alert("Upload Failed", data.message || "Unknown error");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch (err: any) {
      Alert.alert("Upload Error", err.message || "Network request failed");
    } finally {
      setUploading(false);
    }
  };

  const sendTextMessage = async () => {
    const text = input.trim();
    if (!text || !otherUserId || !currentUserId) return;
    const tempId = `temp_${Date.now()}`;
    const replySnapshot = replyingTo;
    setMessages((prev) => {
      const msgs = [...prev];
      if (!msgs.some((m) => m.dateSeparator === "Today"))
        msgs.push({ id: `sep_${Date.now()}`, dateSeparator: "Today" });
      msgs.push({
        id: tempId,
        text,
        sent: true,
        time: formatTime(new Date()),
        read: false,
        replyToId: replySnapshot?.id,
        replyToText: replySnapshot?.text,
        replyToImage: replySnapshot?.imageUrl,
        replyToSender: replySnapshot?.sent ? currentUsername : chatName,
      });
      return msgs;
    });
    setInput("");
    clearReply();
    scrollToEnd();
    try {
      const data = await (
        await fetch(`${API_BASE}/send_message.php`, {
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
        })
      ).json();
      if (data.status === "success") loadMessages(false);
      else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        Alert.alert("Message Failed", data.message || "Could not send message");
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert("Message Failed", "Network request failed");
    }
  };

  const handleSendOrMic = () => {
    if (input.trim().length > 0) sendTextMessage();
    else
      showComingSoon(
        "Voice Record",
        "Voice recording is coming soon. You will be able to record and send voice notes here.",
      );
  };

  const inputBorderColor = inputBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.1)", "rgba(167,139,250,0.5)"],
  });

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0614" />
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={s.loadingText}>Loading messages…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0614" />
        <View style={s.errorWrap}>
          <Text style={s.errorIcon}>⚠️</Text>
          <Text style={s.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0614" />

      {/* ── HEADER ── */}
      <View style={s.headerWrap}>
        <View style={s.header}>
          {/* Avatar */}
          <View style={s.headerAvatarWrap}>
            {resolvedAvatarUrl ? (
              <Image
                source={{ uri: resolvedAvatarUrl }}
                style={[s.headerAvatar, { borderColor: avatarColor + "66" }]}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  s.headerAvatar,
                  s.headerAvatarFallback,
                  {
                    backgroundColor: avatarColor + "22",
                    borderColor: avatarColor + "55",
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

          {/* Name + status */}
          <View style={s.headerInfo}>
            <Text style={s.headerName} numberOfLines={1}>
              {chatName}
            </Text>
            <View style={s.headerStatusRow}>
              {isOnline && <View style={s.headerStatusDot} />}
              <Text
                style={[
                  s.headerSub,
                  { color: isOnline ? "#4ade80" : "rgba(255,255,255,0.35)" },
                ]}
              >
                {isOnline ? "Online now" : "Last seen recently"}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={s.headerActions}>
            {[
              {
                icon: <IconPhone />,
                title: "Voice Call",
                text: "Voice calling is coming soon. This feature will be available in a future update.",
              },
              {
                icon: <IconVideo />,
                title: "Video Call",
                text: "Video calling is coming soon. This feature will be available in a future update.",
              },
              {
                icon: <IconMore />,
                title: "More Options",
                text: "More chat actions are coming soon. New tools will appear here in a future update.",
              },
            ].map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={s.hBtn}
                onPress={() => showComingSoon(btn.title, btn.text)}
                activeOpacity={0.7}
              >
                {btn.icon}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={s.headerDivider} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        {/* ── MESSAGES LIST ── (no RefreshControl) */}
        <ScrollView
          ref={scrollRef}
          style={s.list}
          contentContainerStyle={{
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom + 120, 130),
          }}
          showsVerticalScrollIndicator={false}
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
                  imageSize={bubbleImageSize}
                />
              )}
            </React.Fragment>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* ── REPLY BAR ── */}
        {replyingTo && (
          <View style={s.replyBarWrap}>
            <View style={s.replyBar}>
              <View style={s.replyBarAccent} />
              <View style={{ flex: 1 }}>
                <Text style={s.replyBarLabel}>
                  Replying to{" "}
                  <Text style={s.replyBarName}>
                    {replyingTo.sent ? "yourself" : chatName}
                  </Text>
                </Text>
                {replyingTo.imageUrl ? (
                  <View style={s.replyBarImageRow}>
                    <Image
                      source={{ uri: replyingTo.imageUrl }}
                      style={s.replyBarThumb}
                      resizeMode="cover"
                    />
                    <Text style={s.replyBarText} numberOfLines={1}>
                      📷 Photo
                    </Text>
                  </View>
                ) : (
                  <Text style={s.replyBarText} numberOfLines={1}>
                    {replyingTo.text}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={s.replyBarClose}
                onPress={clearReply}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconClose color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── INPUT BAR ── */}
        <View
          style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}
        >
          <TouchableOpacity
            style={s.inputAction}
            onPress={sendImage}
            disabled={uploading}
            activeOpacity={0.7}
          >
            {uploading ? (
              <ActivityIndicator color="#7c3aed" size="small" />
            ) : (
              <View style={s.inputActionInner}>
                <IconCamera />
              </View>
            )}
          </TouchableOpacity>

          <Animated.View
            style={[s.inputWrap, { borderColor: inputBorderColor }]}
          >
            <TextInput
              style={s.textInput}
              placeholder={replyingTo ? "Send reply…" : "Message…"}
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </Animated.View>

          <TouchableOpacity
            style={[
              s.sendBtn,
              input.trim().length > 0 ? s.sendBtnActive : s.sendBtnIdle,
            ]}
            onPress={handleSendOrMic}
            activeOpacity={0.85}
          >
            {input.trim().length > 0 ? <IconSend /> : <IconMic />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── IMAGE VIEWER MODAL ── */}
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
            <Text style={s.viewerTitle}>Photo</Text>
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
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={s.viewerImage}
                resizeMode="contain"
              />
            )}
          </Pressable>
          <View
            style={[
              s.viewerBottom,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <Text style={s.viewerHint}>Tap anywhere to close</Text>
          </View>
        </View>
      </Modal>

      {/* ── MESSAGE ACTIONS MODAL ── */}
      <Modal
        visible={messageActionsVisible}
        transparent
        animationType="slide"
        onRequestClose={closeMessageActions}
      >
        <Pressable style={s.sheetOverlay} onPress={closeMessageActions}>
          <Pressable
            style={[
              s.sheetCard,
              { paddingBottom: Math.max(insets.bottom + 8, 24) },
            ]}
            onPress={() => {}}
          >
            {/* Handle */}
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>React or act</Text>

            {/* Reactions */}
            <View style={s.reactionsRow}>
              {REACTION_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={s.reactionPickerBtn}
                  onPress={() => applyReaction(emoji)}
                  activeOpacity={0.75}
                >
                  <Text style={s.reactionPickerText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.sheetDivider} />

            <TouchableOpacity
              style={s.sheetBtn}
              onPress={() => {
                if (selectedMessage) startReply(selectedMessage);
                closeMessageActions();
              }}
            >
              <View style={s.sheetBtnIcon}>
                <IconReply color="#a78bfa" />
              </View>
              <Text style={s.sheetBtnText}>Reply to message</Text>
            </TouchableOpacity>

            {!!selectedMessage?.imageUrl && (
              <>
                <TouchableOpacity
                  style={s.sheetBtn}
                  onPress={() => {
                    if (selectedMessage.imageUrl)
                      openImageViewer(selectedMessage.imageUrl);
                    closeMessageActions();
                  }}
                >
                  <View style={s.sheetBtnIcon}>
                    <Text style={{ fontSize: 16 }}>🖼️</Text>
                  </View>
                  <Text style={s.sheetBtnText}>View full image</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.sheetBtn}
                  onPress={() => {
                    if (selectedMessage.imageUrl)
                      downloadImage(selectedMessage.imageUrl);
                    closeMessageActions();
                  }}
                >
                  <View style={s.sheetBtnIcon}>
                    <IconDownload color="#a78bfa" />
                  </View>
                  <Text style={s.sheetBtnText}>Save image</Text>
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

      {/* ── COMING SOON MODAL ── */}
      <Modal
        visible={comingSoonVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setComingSoonVisible(false)}
      >
        <Pressable
          style={s.popupOverlay}
          onPress={() => setComingSoonVisible(false)}
        >
          <Pressable style={s.popupCard} onPress={() => {}}>
            <View style={s.popupIconWrap}>
              <Text style={s.popupIconText}>✨</Text>
            </View>
            <Text style={s.popupTitle}>{comingSoonTitle}</Text>
            <Text style={s.popupText}>{comingSoonText}</Text>
            <TouchableOpacity
              style={s.popupBtn}
              onPress={() => setComingSoonVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={s.popupBtnText}>Got it</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0614" },

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loadingText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontWeight: "600",
  },
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  errorIcon: { fontSize: 40 },
  errorText: {
    color: "#f87171",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
  },

  // Header
  headerWrap: { backgroundColor: "#0a0614" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "android" ? 6 : 4,
    paddingBottom: 12,
    gap: 11,
  },
  headerAvatarWrap: { position: "relative" },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  headerAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: { fontWeight: "800", fontSize: 15, letterSpacing: 0.5 },
  onlineDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4ade80",
    borderWidth: 2,
    borderColor: "#0a0614",
  },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  headerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  headerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },
  headerSub: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  headerActions: { flexDirection: "row", gap: 6, alignItems: "center" },
  hBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  headerDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.07)" },

  list: { flex: 1 },

  // Reply bar
  replyBarWrap: {
    backgroundColor: "#0a0614",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingVertical: 9,
    paddingLeft: 4,
    paddingRight: 10,
    gap: 10,
    overflow: "hidden",
  },
  replyBarAccent: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    backgroundColor: "#a78bfa",
    marginLeft: 8,
    marginVertical: 2,
  },
  replyBarLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
    marginBottom: 2,
  },
  replyBarName: { color: "#a78bfa", fontWeight: "800" },
  replyBarText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 16,
  },
  replyBarImageRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  replyBarThumb: { width: 24, height: 24, borderRadius: 6 },
  replyBarClose: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 10,
    gap: 8,
    backgroundColor: "#0a0614",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  inputAction: {
    width: 44,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  inputActionInner: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  inputWrap: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  textInput: {
    minHeight: 46,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "ios" ? 13 : 11,
    paddingBottom: Platform.OS === "ios" ? 13 : 11,
    color: "#fff",
    fontSize: 15,
    lineHeight: 21,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendBtnIdle: {
    backgroundColor: "rgba(124,58,237,0.25)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.3)",
  },
  sendBtnActive: {
    backgroundColor: "#7c3aed",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },

  // Image viewer
  viewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.97)" },
  viewerTop: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewerTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "700",
  },
  viewerTopBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  viewerBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  viewerImage: { width: "100%", height: "85%", borderRadius: 16 },
  viewerBottom: { alignItems: "center", paddingTop: 10, paddingHorizontal: 20 },
  viewerHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Message actions sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: "#110920",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  reactionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 18,
  },
  reactionPickerBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  reactionPickerText: { fontSize: 22 },
  sheetDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginBottom: 12,
  },
  sheetBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
    marginBottom: 8,
  },
  sheetBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(167,139,250,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBtnText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    fontWeight: "700",
  },
  sheetCancelBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  sheetCancelText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    fontWeight: "700",
  },

  // Coming soon popup
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(5,2,15,0.78)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  popupCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: "#110920",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 20,
  },
  popupIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(167,139,250,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  popupIconText: { fontSize: 32 },
  popupTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.3,
    textAlign: "center",
    marginBottom: 10,
  },
  popupText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  popupBtn: {
    marginTop: 22,
    minWidth: 140,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  popupBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
