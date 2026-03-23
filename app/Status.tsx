/*
  File: app/Status.tsx
  Purpose: WhatsApp-like Status Screen
  Final fixes - March 22, 2026
  • Bottom nav now sits perfectly at bottom (no lifting)
  • Verified badge shows correctly for ALL users (Peter blue, etc.)
  • Owner still has crown + Admin + gold fallback
  • Nav inset fix: SafeAreaView edges exclude bottom, nav uses insets.bottom only
*/

import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { BottomNav } from "./Home";

const API_BASE = "https://unresources.cravii.ng/api";

// ─── THEME SYSTEM ─────────────────────────────────────────────────────────────

type ThemeMode = "dark" | "light" | "midnight" | "forest";

const THEMES = {
  dark: {
    bg: "#08080F",
    bgDeep: "#000000",
    card: "#0F0F1C",
    border: "#1C1C30",
    white: "#FFFFFF",
    whiteSoft: "#E5E5F0",
    whiteMuted: "#A0A0B8",
    faint: "#4B4B6B",
    purpleGlow: "#9B7EFF",
    purpleMid: "#6B2ED9",
    purpleFaint: "#2A1A4D",
    online: "#22D3A0",
    navBg: "#0A0A16",
    statusBar: "light-content" as const,
  },
  light: {
    bg: "#F4F5FB",
    bgDeep: "#ECEDF7",
    card: "#FFFFFF",
    border: "#E2E3F0",
    white: "#1A1B2E",
    whiteSoft: "#2D2F52",
    whiteMuted: "#6B6E94",
    faint: "#9B9EC0",
    purpleGlow: "#6244E5",
    purpleMid: "#5234C8",
    purpleFaint: "rgba(98,68,229,0.1)",
    online: "#16B98C",
    navBg: "#FFFFFF",
    statusBar: "dark-content" as const,
  },
  midnight: {
    bg: "#060810",
    bgDeep: "#030408",
    card: "#0C0E1A",
    border: "#141830",
    white: "#E8EAFF",
    whiteSoft: "#B0B4E0",
    whiteMuted: "#7A7EA8",
    faint: "#303460",
    purpleGlow: "#7AAEFF",
    purpleMid: "#3B78F0",
    purpleFaint: "rgba(79,142,255,0.12)",
    online: "#00E5B0",
    navBg: "#070912",
    statusBar: "light-content" as const,
  },
  forest: {
    bg: "#0A120E",
    bgDeep: "#060D09",
    card: "#0F1A12",
    border: "#182A1E",
    white: "#E6F0E8",
    whiteSoft: "#B8CEBE",
    whiteMuted: "#7A9882",
    faint: "#304038",
    purpleGlow: "#4EEEA0",
    purpleMid: "#22B86A",
    purpleFaint: "rgba(45,216,130,0.12)",
    online: "#FFE066",
    navBg: "#0B140F",
    statusBar: "light-content" as const,
  },
};

type Theme = (typeof THEMES)["dark"];

const THEME_LABELS: Record<ThemeMode, { icon: string; label: string }> = {
  dark: { icon: "◐", label: "Dark" },
  light: { icon: "○", label: "Light" },
  midnight: { icon: "●", label: "Night" },
  forest: { icon: "◈", label: "Forest" },
};

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Story = {
  id: number;
  type: "text" | "image";
  content?: string;
  media_url?: string;
  background_color?: string;
  created_at: string;
  seen?: boolean;
  views?: number;
};

type StatusUser = {
  user_id: number;
  name: string;
  username: string;
  initials?: string;
  color?: string;
  avatar?: string;
  seen: boolean;
  stories: Story[];
  badge_type?: "none" | "blue" | "black" | "gold";
};

// ─── UTILS ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  if (!name) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(dateString: string) {
  const now = new Date().getTime();
  const then = new Date(dateString).getTime();
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function isPlatformOwner(userId: number | string): boolean {
  return Number(userId) === 1;
}

// ─── ICONS ───────────────────────────────────────────────────────────────────

function IconPlus({
  color = "#fff",
  size = 11,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line
        x1="12"
        y1="5"
        x2="12"
        y2="19"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconCamera({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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

function IconText({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M4 12h16M4 18h7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconPalette({ color, size = 19 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2v-.5c0-.55-.22-1.05-.59-1.41-.36-.36-.59-.86-.59-1.41 0-1.1.9-2 2-2h2c3.31 0 6-2.69 6-6 0-4.96-4.48-9-10-9z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Circle cx="8.5" cy="10.5" r="1" fill={color} />
      <Circle cx="12" cy="7.5" r="1" fill={color} />
      <Circle cx="15.5" cy="10.5" r="1" fill={color} />
    </Svg>
  );
}

function IconBell({ color, size = 19 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function VerifiedBadge({
  size = 16,
  type = "gold",
}: {
  size?: number;
  type?: "gold" | "blue" | "black" | "none";
}) {
  if (type === "none") return null;

  let fill = "#FFD700";
  let checkStroke = "#000";

  if (type === "blue") {
    fill = "#1DA1F2";
    checkStroke = "#FFFFFF";
  }
  if (type === "black") {
    fill = "#000000";
    checkStroke = "#FFFFFF";
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill={fill} />
      <Path
        d="M9 12l2 2 4-4"
        stroke={checkStroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CrownIcon({
  size = 14,
  color = "#FFD700",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2L2 7l3 9h14l3-9-10-5zM5 16l2-6 5 4 5-4 2 6z" />
    </Svg>
  );
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────

function UserAvatar({
  user,
  size = 56,
  borderWidth = 2.5,
  T,
}: {
  user: { avatar?: string; color?: string; initials?: string; name: string };
  size?: number;
  borderWidth?: number;
  T: Theme;
}) {
  const hasAvatar = !!user.avatar;
  const bgColor = user.color || T.purpleMid;
  const initials = user.initials || getInitials(user.name);

  if (hasAvatar) {
    return (
      <Image
        source={{ uri: user.avatar }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2 + borderWidth,
          borderWidth,
          borderColor: T.bg,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2 + borderWidth,
        backgroundColor: bgColor,
        borderWidth,
        borderColor: T.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: size * 0.38, fontWeight: "800" }}>
        {initials}
      </Text>
    </View>
  );
}

// ─── THEME SWITCHER ──────────────────────────────────────────────────────────

function ThemeSwitcher({
  current,
  onChange,
  T,
}: {
  current: ThemeMode;
  onChange: (t: ThemeMode) => void;
  T: Theme;
}) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    setOpen(!open);
    Animated.spring(anim, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  return (
    <View style={{ position: "relative" }}>
      <TouchableOpacity
        style={[
          s.iconBtn,
          {
            backgroundColor: T.card,
            borderColor: open ? T.purpleMid : T.border,
          },
        ]}
        onPress={toggle}
        activeOpacity={0.75}
      >
        <IconPalette color={open ? T.purpleGlow : T.whiteMuted} size={19} />
      </TouchableOpacity>

      {open && (
        <Animated.View
          style={[
            s.themeDropdown,
            {
              backgroundColor: T.card,
              borderColor: T.border,
              opacity: anim,
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {(Object.keys(THEME_LABELS) as ThemeMode[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                s.themeOption,
                current === t && { backgroundColor: T.purpleFaint },
              ]}
              onPress={() => {
                onChange(t);
                setOpen(false);
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 8 }}>
                {THEME_LABELS[t].icon}
              </Text>
              <Text
                style={[
                  s.themeLabel,
                  {
                    color: current === t ? T.purpleGlow : T.whiteMuted,
                    fontWeight: current === t ? "700" : "500",
                  },
                ]}
              >
                {THEME_LABELS[t].label}
              </Text>
              {current === t && (
                <View style={[s.themeDot, { backgroundColor: T.purpleGlow }]} />
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

// ─── TOP BAR ─────────────────────────────────────────────────────────────────

function TopBar({
  username,
  theme,
  onThemeChange,
  T,
}: {
  username?: string;
  theme: ThemeMode;
  onThemeChange: (t: ThemeMode) => void;
  T: Theme;
}) {
  return (
    <View style={[s.topBar, { borderBottomColor: T.border }]}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={[s.wordmark, { color: T.white }]}>
          {"UNIMAID "}
          <Text style={{ color: T.purpleGlow }}>RESOURCES</Text>
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[s.wordmarkSub, { color: T.faint }]}>
            University of Maiduguri
          </Text>
          {username && (
            <>
              <Text style={{ color: T.faint, fontSize: 11 }}>·</Text>
              <Text style={[s.usernameTag, { color: T.white }]}>
                @{username}
              </Text>
            </>
          )}
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <ThemeSwitcher current={theme} onChange={onThemeChange} T={T} />
        <TouchableOpacity
          style={[
            s.iconBtn,
            { backgroundColor: T.card, borderColor: T.border },
          ]}
        >
          <IconBell color={T.whiteMuted} size={19} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── STATUS ROW ──────────────────────────────────────────────────────────────

function StatusRow({
  status,
  onPress,
  T,
}: {
  status: StatusUser;
  onPress: () => void;
  T: Theme;
}) {
  const isOwner = isPlatformOwner(status.user_id);
  const badgeType = status.badge_type || (isOwner ? "gold" : "none");
  const latestStory = status.stories[0];

  return (
    <TouchableOpacity
      style={s.statusRow}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View
        style={[
          s.ring,
          status.seen
            ? { backgroundColor: "rgba(255,255,255,0.18)" }
            : { backgroundColor: T.purpleMid },
        ]}
      >
        <UserAvatar user={status} size={52} borderWidth={2.5} T={T} />
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <Text style={[s.statusName, { color: T.whiteSoft }]}>
            {status.name}
          </Text>

          {isOwner && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <CrownIcon size={14} />
              <Text
                style={{ color: "#FFD700", fontSize: 11, fontWeight: "600" }}
              >
                Admin
              </Text>
            </View>
          )}

          {badgeType !== "none" && <VerifiedBadge size={16} type={badgeType} />}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 2,
          }}
        >
          <Text style={[s.statusTime, { color: T.faint }]}>
            {status.stories.length > 0
              ? timeAgo(latestStory.created_at)
              : "No update"}
          </Text>

          {status.stories.length > 0 &&
            latestStory.views !== undefined &&
            latestStory.views > 0 && (
              <>
                <Text style={[s.statusTime, { color: T.faint }]}>·</Text>
                <Text
                  style={[s.statusTime, { color: T.faint, fontWeight: "500" }]}
                >
                  {latestStory.views}{" "}
                  {latestStory.views === 1 ? "view" : "views"}
                </Text>
              </>
            )}
        </View>
      </View>

      {!status.seen && (
        <View style={[s.unseenDot, { backgroundColor: T.purpleGlow }]} />
      )}
    </TouchableOpacity>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Status() {
  const insets = useSafeAreaInsets();

  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const T: Theme = THEMES[themeMode];

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [statuses, setStatuses] = useState<StatusUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [textModalVisible, setTextModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const [statusText, setStatusText] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [postingStatus, setPostingStatus] = useState(false);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const progressValueRef = useRef(0);

  useEffect(() => {
    SecureStore.getItemAsync("theme")
      .then((saved) => {
        if (saved && THEMES[saved as ThemeMode])
          setThemeMode(saved as ThemeMode);
      })
      .catch(() => {});
  }, []);

  const handleThemeChange = (t: ThemeMode) => {
    setThemeMode(t);
    SecureStore.setItemAsync("theme", t).catch(() => {});
  };

  useEffect(() => {
    const sub = progress.addListener(({ value }) => {
      progressValueRef.current = value;
    });
    return () => progress.removeListener(sub);
  }, [progress]);

  const loadStatuses = async (userId: number | string) => {
    try {
      const res = await fetch(
        `${API_BASE}/get_statuses.php?viewer_id=${encodeURIComponent(String(userId))}`,
      );
      const text = await res.text();
      console.log("Statuses raw response:", text);
      const data = JSON.parse(text);
      if (data.status === "success") {
        setStatuses(data.statuses || []);
      }
    } catch (err) {
      console.log("Status load error:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await SecureStore.getItemAsync("user");
        if (stored) {
          const user = JSON.parse(stored);
          setCurrentUser(user);
          if (user?.id) await loadStatuses(user.id);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const resetTextComposer = () => setStatusText("");
  const resetImageComposer = () => {
    setImageCaption("");
    setSelectedImageUri("");
    setUploadingImage(false);
  };

  const addTextStatus = async () => {
    if (!currentUser?.id)
      return Alert.alert("Error", "No logged-in user found");
    if (!statusText.trim()) return Alert.alert("Error", "Please type a status");

    try {
      setPostingStatus(true);
      const res = await fetch(`${API_BASE}/add_status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          type: "text",
          content: statusText.trim(),
          media_url: null,
          background_color: T.purpleMid,
        }),
      });
      const text = await res.text();
      const data = JSON.parse(text);

      if (data.status === "success") {
        resetTextComposer();
        setTextModalVisible(false);
        await loadStatuses(currentUser.id);
      } else {
        Alert.alert("Error", data.message || "Failed to add status");
      }
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
      setPostingStatus(false);
    }
  };

  const pickStatusImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert(
          "Permission required",
          "Allow gallery access to pick image.",
        );
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setSelectedImageUri(asset.uri);
      setUploadingImage(true);

      if (!asset.base64) {
        Alert.alert("Error", "Could not read image data");
        setUploadingImage(false);
        return;
      }

      const originalName =
        asset.fileName ||
        asset.uri.split("/").pop() ||
        `status_${Date.now()}.jpg`;
      const cleanName = originalName.split("?")[0];
      const match = /\.(jpg|jpeg|png|gif|webp)$/i.exec(cleanName);
      const ext = match ? match[1].toLowerCase() : "jpg";

      let mimeType = "image/jpeg";
      if (ext === "png") mimeType = "image/png";
      if (ext === "gif") mimeType = "image/gif";
      if (ext === "webp") mimeType = "image/webp";

      const res = await fetch(`${API_BASE}/upload_status_image_base64.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: asset.base64, mimeType, extension: ext }),
      });

      const text = await res.text();
      console.log("Status image upload raw:", text);
      const data = JSON.parse(text);

      if (data.success && data.imageUrl) {
        setSelectedImageUri(data.imageUrl);
        Alert.alert("Success", "Image uploaded successfully");
      } else {
        setSelectedImageUri("");
        Alert.alert("Upload failed", data.message || "Could not upload image");
      }
    } catch (err: any) {
      console.log("Status image upload error:", err);
      setSelectedImageUri("");
      Alert.alert("Error", err?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const addImageStatus = async () => {
    if (!currentUser?.id)
      return Alert.alert("Error", "No logged-in user found");
    if (!selectedImageUri)
      return Alert.alert("Error", "Please choose an image");
    if (uploadingImage)
      return Alert.alert("Please wait", "Image is still uploading");

    try {
      setPostingStatus(true);
      const res = await fetch(`${API_BASE}/add_status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          type: "image",
          content: imageCaption.trim(),
          media_url: selectedImageUri,
          background_color: null,
        }),
      });
      const text = await res.text();
      const data = JSON.parse(text);

      if (data.status === "success") {
        resetImageComposer();
        setImageModalVisible(false);
        await loadStatuses(currentUser.id);
      } else {
        Alert.alert("Error", data.message || "Failed to post image status");
      }
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
      setPostingStatus(false);
    }
  };

  const markViewed = async (storyId: number) => {
    if (!currentUser?.id) return;
    try {
      await fetch(`${API_BASE}/view_status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_id: storyId, viewer_id: currentUser.id }),
      });
    } catch (err) {
      console.log("View status error:", err);
    }
  };

  const startProgress = (fromValue = 0) => {
    progress.setValue(fromValue);
    const remaining = Math.max(100, (1 - fromValue) * 4000);
    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: remaining,
      useNativeDriver: false,
    });
    animationRef.current.start(({ finished }) => {
      if (finished && !isPaused) nextStory();
    });
  };

  const pauseProgress = () => {
    if (!viewerVisible) return;
    setIsPaused(true);
    animationRef.current?.stop();
  };

  const resumeProgress = () => {
    if (!viewerVisible) return;
    setIsPaused(false);
    startProgress(progressValueRef.current);
  };

  const openViewer = async (index: number) => {
    setStatusIndex(index);
    setStoryIndex(0);
    setViewerVisible(true);
    setIsPaused(false);
    const firstStory = statuses[index]?.stories?.[0];
    if (firstStory?.id) await markViewed(firstStory.id);
    startProgress(0);
  };

  const closeViewer = () => {
    setViewerVisible(false);
    setIsPaused(false);
    animationRef.current?.stop();
    progress.setValue(0);
  };

  const nextStory = async () => {
    const currentStatus = statuses[statusIndex];
    if (!currentStatus) return;

    if (storyIndex < currentStatus.stories.length - 1) {
      const newIndex = storyIndex + 1;
      setStoryIndex(newIndex);
      const story = currentStatus.stories[newIndex];
      if (story?.id) await markViewed(story.id);
      startProgress(0);
    } else if (statusIndex < statuses.length - 1) {
      const nextStatusIndex = statusIndex + 1;
      setStatusIndex(nextStatusIndex);
      setStoryIndex(0);
      const story = statuses[nextStatusIndex]?.stories?.[0];
      if (story?.id) await markViewed(story.id);
      startProgress(0);
    } else {
      closeViewer();
      if (currentUser?.id) await loadStatuses(currentUser.id);
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
      startProgress(0);
    } else if (statusIndex > 0) {
      const prevStatusIndex = statusIndex - 1;
      const prevStatus = statuses[prevStatusIndex];
      setStatusIndex(prevStatusIndex);
      setStoryIndex(prevStatus.stories.length - 1);
      startProgress(0);
    }
  };

  const myStatuses = statuses.filter(
    (st) => String(st.user_id) === String(currentUser?.id),
  );
  const otherStatuses = statuses.filter(
    (st) => String(st.user_id) !== String(currentUser?.id),
  );
  const recent = otherStatuses.filter((st) => !st.seen);
  const viewed = otherStatuses.filter((st) => st.seen);

  const myStatus = myStatuses[0];
  const myAvatarData = {
    avatar: currentUser?.avatar_url || myStatus?.avatar,
    color: currentUser?.color,
    initials: currentUser?.initials,
    name: currentUser?.name || currentUser?.username || "You",
  };

  const myBadgeType =
    myStatus?.badge_type ||
    (isPlatformOwner(currentUser?.id) ? "gold" : "none");

  // Nav height = fixed content height (no inset yet, added via paddingBottom below)
  const NAV_CONTENT_HEIGHT = 56;

  if (loading) {
    return (
      <SafeAreaView
        style={[s.safe, { backgroundColor: T.bg }]}
        edges={["top", "left", "right"]}
      >
        <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
        <ActivityIndicator
          size="large"
          color={T.purpleGlow}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  return (
    // KEY FIX: exclude "bottom" from SafeAreaView edges so it never
    // auto-pads the bottom. We handle bottom inset ourselves on the nav bar.
    <SafeAreaView
      style={[s.safe, { backgroundColor: T.bg }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />

      <View style={{ paddingTop: Platform.OS === "android" ? 2 : 0 }}>
        <TopBar
          username={currentUser?.username || ""}
          theme={themeMode}
          onThemeChange={handleThemeChange}
          T={T}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          // Scroll content clears the fixed nav bar (content height + inset)
          paddingBottom: NAV_CONTENT_HEIGHT + insets.bottom + 8,
        }}
      >
        <TouchableOpacity
          style={[
            s.myCard,
            { backgroundColor: T.purpleFaint, borderColor: `${T.purpleMid}66` },
          ]}
          activeOpacity={0.85}
          onPress={() => {
            if (myStatuses.length > 0) {
              const myIndex = statuses.findIndex(
                (st) => String(st.user_id) === String(currentUser?.id),
              );
              if (myIndex >= 0) openViewer(myIndex);
            } else {
              resetTextComposer();
              setTextModalVisible(true);
            }
          }}
        >
          <View style={s.myAvatarWrap}>
            <UserAvatar user={myAvatarData} size={58} borderWidth={2} T={T} />
            <TouchableOpacity
              style={[
                s.addBtn,
                { backgroundColor: T.purpleGlow, borderColor: T.bg },
              ]}
              onPress={() => {
                resetTextComposer();
                setTextModalVisible(true);
              }}
            >
              <IconPlus />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={[s.myName, { color: T.white }]}>My Status</Text>
              {myBadgeType !== "none" && (
                <VerifiedBadge size={14} type={myBadgeType} />
              )}
            </View>
            <Text style={[s.mySub, { color: T.faint }]}>
              {myStatuses.length > 0
                ? `Tap to view • ${timeAgo(myStatuses[0].stories[0].created_at)}`
                : "Tap + to add a text update"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={s.actionRow}>
          <TouchableOpacity
            style={[
              s.actionBtn,
              { backgroundColor: T.card, borderColor: T.border },
            ]}
            onPress={() => {
              resetTextComposer();
              setTextModalVisible(true);
            }}
          >
            <View
              style={[s.actionIcon, { backgroundColor: `${T.purpleMid}33` }]}
            >
              <IconText color={T.whiteMuted} />
            </View>
            <Text style={[s.actionLabel, { color: T.whiteSoft }]}>
              Text Status
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.actionBtn,
              { backgroundColor: T.card, borderColor: T.border },
            ]}
            onPress={() => {
              resetImageComposer();
              setImageModalVisible(true);
            }}
          >
            <View
              style={[s.actionIcon, { backgroundColor: `${T.purpleMid}33` }]}
            >
              <IconCamera color={T.whiteMuted} />
            </View>
            <Text style={[s.actionLabel, { color: T.whiteSoft }]}>Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.divider, { backgroundColor: T.border }]} />

        {recent.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { color: T.faint }]}>
              RECENT UPDATES
            </Text>
            {recent.map((st) => {
              const realIndex = statuses.findIndex(
                (x) => x.user_id === st.user_id,
              );
              return (
                <StatusRow
                  key={String(st.user_id)}
                  status={st}
                  onPress={() => openViewer(realIndex)}
                  T={T}
                />
              );
            })}
          </>
        )}

        {viewed.length > 0 && (
          <>
            <View style={[s.divider, { backgroundColor: T.border }]} />
            <Text style={[s.sectionLabel, { color: T.faint }]}>VIEWED</Text>
            {viewed.map((st) => {
              const realIndex = statuses.findIndex(
                (x) => x.user_id === st.user_id,
              );
              return (
                <StatusRow
                  key={String(st.user_id)}
                  status={st}
                  onPress={() => openViewer(realIndex)}
                  T={T}
                />
              );
            })}
          </>
        )}

        {recent.length === 0 && viewed.length === 0 && (
          <Text style={[s.emptyText, { color: T.faint }]}>
            No status updates yet
          </Text>
        )}
      </ScrollView>

      {/* Text Status Modal */}
      <Modal
        transparent
        visible={textModalVisible}
        animationType="fade"
        onRequestClose={() => {
          setTextModalVisible(false);
          resetTextComposer();
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setTextModalVisible(false);
            resetTextComposer();
          }}
        >
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  s.modalCard,
                  { backgroundColor: T.card, borderColor: T.border },
                ]}
              >
                <Text style={[s.modalTitle, { color: T.white }]}>
                  Add Text Status
                </Text>
                <TextInput
                  style={[
                    s.statusInput,
                    {
                      backgroundColor: T.bg,
                      borderColor: T.border,
                      color: T.white,
                    },
                  ]}
                  placeholder="What's on your mind?"
                  placeholderTextColor={T.faint}
                  value={statusText}
                  onChangeText={setStatusText}
                  multiline
                  maxLength={300}
                />
                <View style={s.modalButtons}>
                  <TouchableOpacity
                    style={[s.modalCancel, { borderColor: T.border }]}
                    onPress={() => {
                      setTextModalVisible(false);
                      resetTextComposer();
                    }}
                    disabled={postingStatus}
                  >
                    <Text style={[s.modalCancelText, { color: T.white }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.modalPost, { backgroundColor: T.purpleMid }]}
                    onPress={addTextStatus}
                    disabled={postingStatus}
                  >
                    <Text style={s.modalPostText}>
                      {postingStatus ? "Posting..." : "Post Status"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Image Status Modal */}
      <Modal
        transparent
        visible={imageModalVisible}
        animationType="fade"
        onRequestClose={() => {
          setImageModalVisible(false);
          resetImageComposer();
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setImageModalVisible(false);
            resetImageComposer();
          }}
        >
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  s.modalCard,
                  { backgroundColor: T.card, borderColor: T.border },
                ]}
              >
                <Text style={[s.modalTitle, { color: T.white }]}>
                  Add Photo Status
                </Text>

                <TouchableOpacity
                  style={[
                    s.imagePicker,
                    { backgroundColor: T.bg, borderColor: T.border },
                  ]}
                  onPress={pickStatusImage}
                  disabled={uploadingImage || postingStatus}
                >
                  {selectedImageUri ? (
                    <Image
                      source={{ uri: selectedImageUri }}
                      style={s.previewImage}
                    />
                  ) : (
                    <Text style={[s.imagePickerText, { color: T.faint }]}>
                      Tap to choose status image
                    </Text>
                  )}
                </TouchableOpacity>

                {uploadingImage && (
                  <View style={{ marginBottom: 12, alignItems: "center" }}>
                    <ActivityIndicator color={T.purpleGlow} />
                    <Text
                      style={{
                        color: T.whiteMuted,
                        marginTop: 8,
                        fontSize: 13,
                      }}
                    >
                      Uploading image...
                    </Text>
                  </View>
                )}

                <TextInput
                  style={[
                    s.captionInput,
                    {
                      backgroundColor: T.bg,
                      borderColor: T.border,
                      color: T.white,
                    },
                  ]}
                  placeholder="Add a caption (optional)"
                  placeholderTextColor={T.faint}
                  value={imageCaption}
                  onChangeText={setImageCaption}
                  multiline
                  maxLength={200}
                />

                <View style={s.modalButtons}>
                  <TouchableOpacity
                    style={[s.modalCancel, { borderColor: T.border }]}
                    onPress={() => {
                      setImageModalVisible(false);
                      resetImageComposer();
                    }}
                    disabled={uploadingImage || postingStatus}
                  >
                    <Text style={[s.modalCancelText, { color: T.white }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.modalPost, { backgroundColor: T.purpleMid }]}
                    onPress={addImageStatus}
                    disabled={uploadingImage || postingStatus}
                  >
                    <Text style={s.modalPostText}>
                      {uploadingImage
                        ? "Uploading..."
                        : postingStatus
                          ? "Posting..."
                          : "Post Photo"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Status Viewer */}
      <Modal
        visible={viewerVisible}
        animationType="fade"
        onRequestClose={closeViewer}
      >
        {viewerVisible &&
          (() => {
            const currentStatus = statuses[statusIndex];
            const currentStory = currentStatus?.stories?.[storyIndex];

            if (!currentStatus || !currentStory) {
              return (
                <View style={s.viewer}>
                  <Text
                    style={{ color: "#fff", fontSize: 18, textAlign: "center" }}
                  >
                    No story available
                  </Text>
                </View>
              );
            }

            return (
              <View
                style={[
                  s.viewer,
                  {
                    backgroundColor:
                      currentStory.type === "image"
                        ? "#000"
                        : currentStory.background_color || THEMES.dark.bgDeep,
                  },
                ]}
              >
                <View style={s.progressWrap}>
                  {(currentStatus.stories || []).map((_, i) => {
                    const isActive = i === storyIndex;
                    const isPassed = i < storyIndex;
                    return (
                      <View key={i} style={s.progressBar}>
                        {isPassed ? (
                          <View style={s.progressFillFull} />
                        ) : isActive ? (
                          <Animated.View
                            style={[
                              s.progressFillAnimated,
                              {
                                width: progress.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ["0%", "100%"],
                                }),
                              },
                            ]}
                          />
                        ) : null}
                      </View>
                    );
                  })}
                </View>

                <View style={s.viewerHeader}>
                  <Text style={s.viewerName}>{currentStatus.name}</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Text style={s.viewerTime}>
                      {currentStory.created_at
                        ? timeAgo(currentStory.created_at)
                        : ""}
                    </Text>
                    {currentStory.views !== undefined &&
                      currentStory.views > 0 && (
                        <Text style={s.viewerViews}>
                          👁 {currentStory.views}
                        </Text>
                      )}
                  </View>
                </View>

                <View style={s.viewerCenter}>
                  {currentStory.type === "image" && currentStory.media_url ? (
                    <>
                      <Image
                        source={{ uri: currentStory.media_url }}
                        style={s.viewerImage}
                        resizeMode="contain"
                      />
                      {currentStory.content && (
                        <View style={s.captionWrap}>
                          <Text style={s.viewerCaption}>
                            {currentStory.content}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={s.viewerText}>
                      {currentStory.content || ""}
                    </Text>
                  )}
                </View>

                <View style={s.touchAreas}>
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={prevStory}
                    onLongPress={pauseProgress}
                    onPressOut={resumeProgress}
                    delayLongPress={150}
                  />
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={nextStory}
                    onLongPress={pauseProgress}
                    onPressOut={resumeProgress}
                    delayLongPress={150}
                  />
                </View>

                <TouchableOpacity style={s.closeArea} onPress={closeViewer}>
                  <Text style={s.closeText}>×</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
      </Modal>

      {/*
        ─── BOTTOM NAVIGATION ────────────────────────────────────────────────
        KEY FIX EXPLAINED:
        • SafeAreaView edges above excludes "bottom" — so no auto bottom padding
        • This View sits at the very bottom of the screen
        • paddingBottom = insets.bottom handles gesture bar / home indicator
          on all devices (Android gesture nav, iPhone home indicator, etc.)
        • No double-inset. No shifting. Works on notched & non-notched devices.
      */}
      <View
        style={{
          backgroundColor: T.navBg || T.card,
          paddingBottom: insets.bottom,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: T.border,
        }}
      >
        <BottomNav active="status" T={T} />
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  wordmark: { fontSize: 21, fontWeight: "900", letterSpacing: 0.6 },
  wordmarkSub: { fontSize: 11, marginTop: 2, letterSpacing: 0.4 },
  usernameTag: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  themeDropdown: {
    position: "absolute",
    top: 48,
    right: 0,
    width: 150,
    borderRadius: 14,
    borderWidth: 1,
    zIndex: 999,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  themeLabel: { fontSize: 14, flex: 1 },
  themeDot: { width: 6, height: 6, borderRadius: 3 },

  myCard: {
    margin: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  myAvatarWrap: { position: "relative" },
  addBtn: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  myName: { fontSize: 15, fontWeight: "700" },
  mySub: { fontSize: 12, marginTop: 2 },

  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 14, fontWeight: "600" },

  divider: { height: 1, marginHorizontal: 20, marginVertical: 10 },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  ring: { width: 56, height: 56, borderRadius: 17, padding: 2.5 },

  statusName: { fontSize: 15, fontWeight: "700" },
  statusTime: { fontSize: 12, marginTop: 2 },
  unseenDot: { width: 10, height: 10, borderRadius: 5 },

  emptyText: { textAlign: "center", marginTop: 40, fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: { width: "100%", borderRadius: 20, borderWidth: 1, padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 14 },
  statusInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    textAlignVertical: "top",
    fontSize: 15,
  },
  imagePicker: {
    width: "100%",
    height: 260,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 12,
  },
  imagePickerText: { fontSize: 14 },
  previewImage: { width: "100%", height: "100%", resizeMode: "contain" },
  captionInput: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    textAlignVertical: "top",
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalCancelText: { fontWeight: "700" },
  modalPost: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  modalPostText: { color: "#fff", fontWeight: "800" },

  viewer: { flex: 1 },
  progressWrap: {
    position: "absolute",
    top: 50,
    left: 14,
    right: 14,
    flexDirection: "row",
    gap: 4,
    zIndex: 10,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFillFull: { width: "100%", height: "100%", backgroundColor: "#fff" },
  progressFillAnimated: { height: "100%", backgroundColor: "#fff" },
  viewerHeader: {
    position: "absolute",
    top: 62,
    left: 18,
    right: 18,
    zIndex: 11,
  },
  viewerName: { color: "#fff", fontWeight: "800", fontSize: 15 },
  viewerTime: { color: "rgba(255,255,255,0.72)", fontSize: 12, marginTop: 2 },
  viewerViews: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
  },
  viewerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  viewerText: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 38,
    textAlign: "center",
    fontWeight: "700",
  },
  viewerImage: {
    width: "100%",
    height: "78%",
    resizeMode: "contain",
  },
  captionWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 34,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  viewerCaption: {
    color: "#fff",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 22,
  },
  touchAreas: {
    position: "absolute",
    width: "100%",
    height: "100%",
    flexDirection: "row",
  },
  closeArea: {
    position: "absolute",
    top: 38,
    right: 14,
    zIndex: 12,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "#fff", fontSize: 28, lineHeight: 28 },
});
