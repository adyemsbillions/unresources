/*
  File: app/Profile.tsx
  Purpose: Unimaid Resources — Profile Screen (Cleaned up)
*/

import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
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
import Svg, { Circle, Line, Path } from "react-native-svg";

const API_BASE = "https://unresources.cravii.ng/api";

// ─── THEME SYSTEM ─────────────────────────────────────────

type ThemeMode = "dark" | "light" | "midnight" | "forest";

function buildTheme(t: {
  bg: string;
  bgDeep: string;
  card: string;
  cardHover: string;
  border: string;
  borderStrong: string;
  text: string;
  textSoft: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentGlow: string;
  accentFaint: string;
  accentMid: string;
  online: string;
  navBg: string;
  badge: string;
  badgeText: string;
  unreadDot: string;
  statusBar: "light-content" | "dark-content";
  shadow: string;
}) {
  return t;
}

const THEMES: Record<ThemeMode, ReturnType<typeof buildTheme>> = {
  dark: buildTheme({
    bg: "#0D0E14",
    bgDeep: "#08090E",
    card: "#141520",
    cardHover: "#1A1B2A",
    border: "#1E2035",
    borderStrong: "#2A2C48",
    text: "#F0F0FF",
    textSoft: "#C5C7E8",
    textMuted: "#6B6E94",
    textFaint: "#3E4168",
    accent: "#7C5CFC",
    accentGlow: "#9B7EFF",
    accentFaint: "rgba(124,92,252,0.12)",
    accentMid: "#6244E5",
    online: "#22D3A0",
    navBg: "#0F1018",
    badge: "#7C5CFC",
    badgeText: "#FFFFFF",
    unreadDot: "#22D3A0",
    statusBar: "light-content",
    shadow: "rgba(0,0,0,0.6)",
  }),
  light: buildTheme({
    bg: "#F4F5FB",
    bgDeep: "#ECEDF7",
    card: "#FFFFFF",
    cardHover: "#F0F0FF",
    border: "#E2E3F0",
    borderStrong: "#C8CAE8",
    text: "#1A1B2E",
    textSoft: "#2D2F52",
    textMuted: "#6B6E94",
    textFaint: "#9B9EC0",
    accent: "#6244E5",
    accentGlow: "#6244E5",
    accentFaint: "rgba(98,68,229,0.08)",
    accentMid: "#5234C8",
    online: "#16B98C",
    navBg: "#FFFFFF",
    badge: "#6244E5",
    badgeText: "#FFFFFF",
    unreadDot: "#16B98C",
    statusBar: "dark-content",
    shadow: "rgba(50,50,100,0.15)",
  }),
  midnight: buildTheme({
    bg: "#060810",
    bgDeep: "#030408",
    card: "#0C0E1A",
    cardHover: "#111428",
    border: "#141830",
    borderStrong: "#1E2244",
    text: "#E8EAFF",
    textSoft: "#B0B4E0",
    textMuted: "#5B5F88",
    textFaint: "#303460",
    accent: "#4F8EFF",
    accentGlow: "#7AAEFF",
    accentFaint: "rgba(79,142,255,0.12)",
    accentMid: "#3B78F0",
    online: "#00E5B0",
    navBg: "#070912",
    badge: "#4F8EFF",
    badgeText: "#FFFFFF",
    unreadDot: "#00E5B0",
    statusBar: "light-content",
    shadow: "rgba(0,0,0,0.8)",
  }),
  forest: buildTheme({
    bg: "#0A120E",
    bgDeep: "#060D09",
    card: "#0F1A12",
    cardHover: "#142018",
    border: "#182A1E",
    borderStrong: "#213D29",
    text: "#E6F0E8",
    textSoft: "#B8CEBE",
    textMuted: "#5C7A64",
    textFaint: "#304038",
    accent: "#2DD882",
    accentGlow: "#4EEEA0",
    accentFaint: "rgba(45,216,130,0.12)",
    accentMid: "#22B86A",
    online: "#FFE066",
    navBg: "#0B140F",
    badge: "#2DD882",
    badgeText: "#050D07",
    unreadDot: "#FFE066",
    statusBar: "light-content",
    shadow: "rgba(0,0,0,0.6)",
  }),
};

const THEME_LABELS: Record<ThemeMode, { icon: string; label: string }> = {
  dark: { icon: "◐", label: "Dark" },
  light: { icon: "○", label: "Light" },
  midnight: { icon: "●", label: "Night" },
  forest: { icon: "◈", label: "Forest" },
};

const ACCENT_PRESETS = [
  "#7C5CFC",
  "#6244E5",
  "#4F8EFF",
  "#22D3A0",
  "#2DD882",
  "#FF8A00",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
  "#F59E0B",
];

// ─── TYPES ────────────────────────────────────────────────

type UserType = {
  id?: number | string;
  username?: string;
  full_name?: string;
  bio?: string;
  department?: string;
  level?: string;
  initials?: string;
  color?: string;
  avatar_url?: string;
  email?: string;
};

type ThemeType = ReturnType<typeof buildTheme>;

// ─── ICONS ────────────────────────────────────────────────

function IconEdit({ color = "#fff", size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconChevron({ color = "#888", size = 17 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconLogout({ color = "#F87171", size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 17l5-5-5-5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 12H9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconPalette({ color = "#888", size = 20 }) {
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

function IconX({ color = "#888", size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line
        x1="18"
        y1="6"
        x2="6"
        y2="18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="6"
        y1="6"
        x2="18"
        y2="18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconCheck({ color = "#fff", size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconChat({ color = "#fff", size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 0 2 2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconStatus({ color = "#fff", size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.8} />
      <Path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconMarket({ color = "#fff", size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="3"
        y1="6"
        x2="21"
        y2="6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M16 10a4 4 0 0 1-8 0"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconProfileNav({ color = "#fff", size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth={1.8} />
      <Path
        d="M5 20a7 7 0 0 1 14 0"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconShield({ color = "#888", size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconHelp({ color = "#888", size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="17" r="0.8" fill={color} />
    </Svg>
  );
}

function IconStar({ color = "#888", size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────

const NAV_ITEMS = [
  { id: "chats", label: "Chats", route: "/Home" },
  { id: "status", label: "Status", route: "/Status" },
  { id: "marketplace", label: "Market", route: "/Marketplace" },
  { id: "profile", label: "Profile", route: "/Profile" },
];

function NavIcon({ id, color }: { id: string; color: string }) {
  if (id === "chats") return <IconChat color={color} />;
  if (id === "status") return <IconStatus color={color} />;
  if (id === "marketplace") return <IconMarket color={color} />;
  if (id === "profile") return <IconProfileNav color={color} />;
  return null;
}

function BottomNav({ active, C }: { active: string; C: ThemeType }) {
  const router = useRouter();
  return (
    <View
      style={[
        s.bottomNav,
        { backgroundColor: C.navBg, borderTopColor: C.border },
      ]}
    >
      {NAV_ITEMS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={s.navItem}
            onPress={() => router.replace(tab.route as any)}
            activeOpacity={0.7}
          >
            <View
              style={[
                s.navIconWrap,
                isActive && { backgroundColor: C.accentFaint },
              ]}
            >
              <NavIcon
                id={tab.id}
                color={isActive ? C.accentGlow : C.textFaint}
              />
            </View>
            <Text
              style={[
                s.navLabel,
                { color: isActive ? C.accentGlow : C.textFaint },
                isActive && { fontWeight: "700" },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── THEME SWITCHER ───────────────────────────────────────

function ThemeSwitcher({
  current,
  onChange,
  C,
}: {
  current: ThemeMode;
  onChange: (t: ThemeMode) => void;
  C: ThemeType;
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
        style={[s.iconBtn, { backgroundColor: C.card, borderColor: C.border }]}
        onPress={toggle}
        activeOpacity={0.75}
      >
        <IconPalette color={open ? C.accentGlow : C.textMuted} />
      </TouchableOpacity>

      {open && (
        <Animated.View
          style={[
            s.themeDropdown,
            {
              backgroundColor: C.card,
              borderColor: C.borderStrong,
              opacity: anim,
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
              shadowColor: C.shadow,
            },
          ]}
        >
          {(Object.keys(THEMES) as ThemeMode[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                s.themeOption,
                current === t && { backgroundColor: C.accentFaint },
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
                    color: current === t ? C.accentGlow : C.textSoft,
                    fontWeight: current === t ? "700" : "500",
                  },
                ]}
              >
                {THEME_LABELS[t].label}
              </Text>
              {current === t && (
                <View style={[s.themeDot, { backgroundColor: C.accentGlow }]} />
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

// ─── FIELD INPUT ──────────────────────────────────────────

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  maxLength,
  autoCapitalize,
  C: TC,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  C: ThemeType;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={[s.modalLabel, { color: TC.textMuted }]}>{label}</Text>
      <TextInput
        style={[
          s.modalInput,
          {
            backgroundColor: TC.bgDeep,
            color: TC.text,
            borderColor: focused ? TC.accentMid : TC.border,
            minHeight: multiline ? 90 : 48,
            textAlignVertical: multiline ? "top" : "center",
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={TC.textFaint}
        multiline={multiline}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// ─── MENU DATA (cleaned — only real, working items) ───────

const MENU_SECTIONS = [
  {
    title: "ACCOUNT",
    items: [
      {
        icon: <IconShield size={18} color="#fff" />,
        label: "Privacy & Security",
        bg: "#065f46",
      },
      {
        icon: <IconShield size={18} color="#fff" />,
        label: "Request Verification",
        bg: "#4c1d95",
      },
    ],
  },
  {
    title: "APPEARANCE",
    items: [
      {
        icon: <IconPalette size={18} color="#fff" />,
        label: "Theme & Colors",
        bg: "#9d174d",
      },
    ],
  },
  {
    title: "SUPPORT",
    items: [
      {
        icon: <IconHelp size={18} color="#fff" />,
        label: "Help & Support",
        bg: "#1e3a5f",
      },
      {
        icon: <IconStar size={18} color="#fff" />,
        label: "Rate the App",
        bg: "#78350f",
      },
    ],
  },
];

// ─── MAIN ─────────────────────────────────────────────────

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: passedUser } = useLocalSearchParams();

  const [theme, setTheme] = useState<ThemeMode>("dark");
  const C = THEMES[theme];

  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    bio: "",
    department: "",
    level: "",
    initials: "",
    color: "",
    avatar_url: "",
  });

  const handleThemeChange = async (t: ThemeMode) => {
    setTheme(t);
    try {
      await SecureStore.setItemAsync("theme", t);
    } catch {}
  };

  useEffect(() => {
    SecureStore.getItemAsync("theme")
      .then((t) => {
        if (t && THEMES[t as ThemeMode]) setTheme(t as ThemeMode);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        let userData: UserType | null = null;
        if (passedUser && typeof passedUser === "string")
          userData = JSON.parse(passedUser);
        if (!userData) {
          const stored = await SecureStore.getItemAsync("user");
          if (stored) userData = JSON.parse(stored);
        }
        if (userData) {
          setCurrentUser(userData);
          setEditForm({
            full_name: userData.full_name || userData.username || "",
            bio: userData.bio || "",
            department: userData.department || "",
            level: userData.level || "",
            initials: userData.initials || "",
            color: userData.color || "#7C5CFC",
            avatar_url: userData.avatar_url || "",
          });
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [passedUser]);

  const uploadAvatarBase64 = async (
    imageBase64: string,
    extension: string,
    mimeType: string,
  ) => {
    const res = await fetch(`${API_BASE}/upload_profile_image_base64.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64, extension, mimeType }),
    });
    const data = await res.json();
    if (data.success && data.imageUrl) return data.imageUrl as string;
    throw new Error(data.message || "Avatar upload failed");
  };

  const pickAvatar = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow access to your photo library.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (result.canceled || !result.assets?.[0]?.base64) return;
      const asset = result.assets[0];
      setUploadingAvatar(true);
      const name = (
        asset.fileName ||
        asset.uri.split("/").pop() ||
        "avatar.jpg"
      ).split("?")[0];
      const ext = (
        /\.(jpg|jpeg|png|gif|webp)$/i.exec(name)?.[1] || "jpg"
      ).toLowerCase();
      const mimeMap: Record<string, string> = {
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
      };
      const mimeType = mimeMap[ext] || "image/jpeg";
      const uploadedUrl = await uploadAvatarBase64(asset.base64, ext, mimeType);
      setEditForm((prev) => ({ ...prev, avatar_url: uploadedUrl }));
      Alert.alert("Success", "Avatar updated.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.id) {
      Alert.alert("Error", "No user ID found.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        user_id: currentUser.id,
        name: editForm.full_name.trim(),
        bio: editForm.bio.trim(),
        department: editForm.department.trim(),
        level: editForm.level.trim(),
        initials: editForm.initials.trim().toUpperCase(),
        accent_color: editForm.color,
        profile_picture: editForm.avatar_url,
      };
      const res = await fetch(`${API_BASE}/update_profile.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.status === "success") {
        const updatedUser = {
          ...currentUser,
          full_name: body.name,
          bio: body.bio,
          department: body.department,
          level: body.level,
          initials: body.initials,
          color: body.accent_color,
          avatar_url: body.profile_picture,
        };
        setCurrentUser(updatedUser);
        await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
        setEditModalVisible(false);
        Alert.alert("Success", "Profile updated.");
      } else {
        Alert.alert("Error", data.message || "Failed to update profile.");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("user");
          await SecureStore.deleteItemAsync("user_id");
          await SecureStore.deleteItemAsync("username");
          router.replace("/login");
        },
      },
    ]);
  };

  // New function: Open WhatsApp with pre-filled message
  const handleRequestVerification = async () => {
    const name = currentUser?.full_name || currentUser?.username || "User";
    const phone = "2349139293270"; // international format without +
    const message = `Hi Unimaid Resources, I am interested in the verification. I know I have to pay ₦700 for it. My name is ${name}.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;

    try {
      // Optional: check if can open (but many recommend skipping canOpenURL for WhatsApp)
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert(
          "WhatsApp not found",
          "Please install WhatsApp to request verification.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Could not open WhatsApp. Make sure it's installed.",
      );
    }
  };

  const name = currentUser?.full_name || currentUser?.username || "Guest";
  const handleText = currentUser?.username
    ? `@${currentUser.username}`
    : "@unknown";
  const bioText = currentUser?.bio || "";
  const deptLevel =
    currentUser?.department && currentUser?.level
      ? `${currentUser.department} · ${currentUser.level}`
      : "University of Maiduguri";
  const initials =
    currentUser?.initials || name.slice(0, 2).toUpperCase() || "??";
  const avatarColor = currentUser?.color || C.accentMid;
  const previewColor = editForm.color || avatarColor;

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]} edges={["top"]}>
        <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />
        <View style={s.centerWrap}>
          <ActivityIndicator size="large" color={C.accentGlow} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]} edges={["top"]}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />

      {/* Top accent line */}
      <View style={[s.accentLine, { backgroundColor: C.accent }]} />

      {/* Top bar */}
      <View style={[s.topBar, { borderBottomColor: C.border }]}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <View
            style={[
              s.logoMark,
              { backgroundColor: C.accentFaint, borderColor: C.accentMid },
            ]}
          >
            <Text style={[s.logoMarkText, { color: C.accentGlow }]}>U</Text>
          </View>
          <View>
            <Text style={[s.wordmark, { color: C.text }]}>
              UNIMAID <Text style={{ color: C.accentGlow }}>RESOURCES</Text>
            </Text>
            <Text style={[s.wordmarkSub, { color: C.textMuted }]}>
              Your Profile
            </Text>
          </View>
        </View>
        <View style={s.topActions}>
          <ThemeSwitcher current={theme} onChange={handleThemeChange} C={C} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 80 + insets.bottom, // nav height + safe area
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero card ── */}
        <View
          style={[
            s.heroCard,
            { backgroundColor: C.card, borderColor: C.border },
          ]}
        >
          <View style={[s.heroBanner, { backgroundColor: avatarColor + "18" }]}>
            <View
              style={[
                s.heroBannerStripe,
                { backgroundColor: avatarColor + "30" },
              ]}
            />
          </View>

          <View style={s.heroBody}>
            {/* Avatar */}
            <View style={s.avatarWrap}>
              {currentUser?.avatar_url ? (
                <Image
                  source={{ uri: currentUser.avatar_url }}
                  style={[
                    s.avatarImage,
                    {
                      borderColor: avatarColor + "66",
                      backgroundColor: C.bgDeep,
                    },
                  ]}
                />
              ) : (
                <View
                  style={[
                    s.avatar,
                    {
                      backgroundColor: avatarColor + "22",
                      borderColor: avatarColor + "66",
                    },
                  ]}
                >
                  <Text style={[s.avatarText, { color: avatarColor }]}>
                    {initials}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[
                  s.editAvatarBtn,
                  { backgroundColor: C.accentMid, borderColor: C.bg },
                ]}
                onPress={() => setEditModalVisible(true)}
              >
                <IconEdit color="#fff" size={13} />
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={s.heroInfo}>
              <Text style={[s.heroName, { color: C.text }]}>{name}</Text>
              <Text style={[s.heroHandle, { color: C.accentGlow }]}>
                {handleText}
              </Text>
              <Text style={[s.heroDept, { color: C.textMuted }]}>
                {deptLevel}
              </Text>
              {!!bioText && (
                <Text style={[s.heroBio, { color: C.textSoft }]}>
                  {bioText}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                s.editProfileBtn,
                { backgroundColor: C.accentFaint, borderColor: C.accentMid },
              ]}
              onPress={() => setEditModalVisible(true)}
              activeOpacity={0.8}
            >
              <IconEdit color={C.accentGlow} size={15} />
              <Text style={[s.editProfileText, { color: C.accentGlow }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Quick access: Handouts / Quizzes / Summaries ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <View
            style={[
              s.statsContainer,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            {[
              { label: "Handouts", route: "/handouts" },
              { label: "Quizzes", route: "/quizzes" },
              { label: "Summaries", route: null },
            ].map((item, i, arr) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={s.statButton}
                  onPress={() => item.route && router.push(item.route as any)}
                  activeOpacity={item.route ? 0.75 : 1}
                >
                  <Text
                    style={[
                      s.statText,
                      { color: item.route ? C.accentGlow : C.textMuted },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
                {i < arr.length - 1 && (
                  <View
                    style={[s.statSeparator, { backgroundColor: C.border }]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── Menu sections ── */}
        {MENU_SECTIONS.map((section, si) => (
          <View key={si} style={s.menuSection}>
            <Text style={[s.sectionLabel, { color: C.textFaint }]}>
              {section.title}
            </Text>
            <View
              style={[
                s.menuGroup,
                { backgroundColor: C.card, borderColor: C.border },
              ]}
            >
              {section.items.map((item, ii) => (
                <View key={ii}>
                  <TouchableOpacity
                    style={s.menuItem}
                    activeOpacity={0.72}
                    onPress={() => {
                      if (item.label === "Request Verification") {
                        handleRequestVerification();
                      }
                      // other menu items can have logic added later
                    }}
                  >
                    <View style={[s.menuIconBox, { backgroundColor: item.bg }]}>
                      {item.icon}
                    </View>
                    <Text style={[s.menuLabel, { color: C.textSoft }]}>
                      {item.label}
                    </Text>
                    <IconChevron color={C.textFaint} />
                  </TouchableOpacity>
                  {ii < section.items.length - 1 && (
                    <View
                      style={[s.itemDivider, { backgroundColor: C.border }]}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* ── Sign out ── */}
        <TouchableOpacity
          style={[
            s.logoutBtn,
            {
              backgroundColor: "rgba(239,68,68,0.08)",
              borderColor: "rgba(239,68,68,0.25)",
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <IconLogout color="#EF4444" size={18} />
          <Text style={[s.logoutText, { color: "#EF4444" }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[s.version, { color: C.textFaint }]}>
          Unimaid Resources v4.0.0
        </Text>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal
        animationType="slide"
        transparent
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
        >
          <View style={s.modalOverlay}>
            <View
              style={[
                s.modalSheet,
                { backgroundColor: C.card, borderColor: C.borderStrong },
              ]}
            >
              <View
                style={[s.modalHandle, { backgroundColor: C.borderStrong }]}
              />

              <View style={[s.modalHeader, { borderBottomColor: C.border }]}>
                <Text style={[s.modalTitle, { color: C.text }]}>
                  Edit Profile
                </Text>
                <TouchableOpacity
                  style={[
                    s.modalCloseBtn,
                    { backgroundColor: C.cardHover, borderColor: C.border },
                  ]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <IconX color={C.textMuted} size={15} />
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
              >
                {/* Avatar preview */}
                <View style={s.modalAvatarRow}>
                  {editForm.avatar_url ? (
                    <Image
                      source={{ uri: editForm.avatar_url }}
                      style={[
                        s.modalAvatarImage,
                        {
                          borderColor: previewColor + "66",
                          backgroundColor: C.bgDeep,
                        },
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        s.modalAvatar,
                        {
                          backgroundColor: previewColor + "22",
                          borderColor: previewColor + "66",
                        },
                      ]}
                    >
                      <Text
                        style={[s.modalAvatarText, { color: previewColor }]}
                      >
                        {editForm.initials || initials}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.modalAvatarHint, { color: C.textMuted }]}>
                      Profile preview
                    </Text>
                    <Text
                      style={{ color: C.textFaint, fontSize: 12, marginTop: 2 }}
                    >
                      Avatar & color update live
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    s.avatarUploadBtn,
                    {
                      backgroundColor: C.accentFaint,
                      borderColor: C.accentMid,
                    },
                  ]}
                  onPress={pickAvatar}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color={C.accentGlow} />
                  ) : (
                    <IconEdit color={C.accentGlow} size={15} />
                  )}
                  <Text style={[s.avatarUploadText, { color: C.accentGlow }]}>
                    {uploadingAvatar ? "Uploading..." : "Choose Avatar"}
                  </Text>
                </TouchableOpacity>

                <FieldInput
                  label="Full Name"
                  value={editForm.full_name}
                  onChange={(v) => setEditForm({ ...editForm, full_name: v })}
                  placeholder="Your full name"
                  autoCapitalize="words"
                  C={C}
                />
                <FieldInput
                  label="Bio"
                  value={editForm.bio}
                  onChange={(v) => setEditForm({ ...editForm, bio: v })}
                  placeholder="Tell us about yourself…"
                  multiline
                  C={C}
                />
                <FieldInput
                  label="Department"
                  value={editForm.department}
                  onChange={(v) => setEditForm({ ...editForm, department: v })}
                  placeholder="e.g. Computer Science"
                  autoCapitalize="words"
                  C={C}
                />
                <FieldInput
                  label="Level"
                  value={editForm.level}
                  onChange={(v) => setEditForm({ ...editForm, level: v })}
                  placeholder="e.g. 300L"
                  C={C}
                />
                <FieldInput
                  label="Initials (2 letters)"
                  value={editForm.initials}
                  onChange={(v) =>
                    setEditForm({
                      ...editForm,
                      initials: v.toUpperCase().slice(0, 2),
                    })
                  }
                  placeholder="e.g. AE"
                  maxLength={2}
                  autoCapitalize="characters"
                  C={C}
                />

                <Text style={[s.modalLabel, { color: C.textMuted }]}>
                  Accent Color
                </Text>
                <View style={s.colorGrid}>
                  {ACCENT_PRESETS.map((color) => {
                    const selected = editForm.color === color;
                    return (
                      <TouchableOpacity
                        key={color}
                        style={[
                          s.colorChip,
                          {
                            backgroundColor: color,
                            borderColor: selected ? C.text : "transparent",
                          },
                        ]}
                        onPress={() => setEditForm({ ...editForm, color })}
                      >
                        {selected && <IconCheck color="#fff" size={14} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={s.modalButtons}>
                  <TouchableOpacity
                    style={[
                      s.modalCancelBtn,
                      { backgroundColor: C.cardHover, borderColor: C.border },
                    ]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={[s.modalBtnText, { color: C.textMuted }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      s.modalSaveBtn,
                      {
                        backgroundColor: C.accentMid,
                        opacity: saving ? 0.7 : 1,
                      },
                    ]}
                    onPress={handleSaveProfile}
                    disabled={saving || uploadingAvatar}
                  >
                    {saving ? (
                      <ActivityIndicator size={16} color="#fff" />
                    ) : (
                      <IconCheck color="#fff" size={16} />
                    )}
                    <Text style={s.modalBtnTextWhite}>
                      {saving ? "Saving…" : "Save Changes"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bottom Navigation with safe area padding */}
      <View
        style={{
          backgroundColor: C.navBg || C.card,
          paddingBottom: insets.bottom,
        }}
      >
        <BottomNav active="profile" C={C} />
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  accentLine: { height: 2, width: "100%", opacity: 0.6 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  logoMarkText: { fontSize: 18, fontWeight: "900" },
  wordmark: { fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
  wordmarkSub: { fontSize: 11, marginTop: 1 },
  topActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  themeDropdown: {
    position: "absolute",
    top: 46,
    right: 0,
    width: 150,
    borderRadius: 14,
    borderWidth: 1,
    zIndex: 999,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
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

  heroCard: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  heroBanner: { height: 52, position: "relative" },
  heroBannerStripe: {
    position: "absolute",
    right: -20,
    top: 0,
    bottom: 0,
    width: "55%",
    borderBottomLeftRadius: 40,
  },
  heroBody: { padding: 16, paddingTop: 0, alignItems: "center" },
  avatarWrap: { position: "relative", marginTop: -30, marginBottom: 10 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  avatarImage: { width: 80, height: 80, borderRadius: 26, borderWidth: 3 },
  avatarText: { fontSize: 28, fontWeight: "900" },
  editAvatarBtn: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  heroInfo: { alignItems: "center", gap: 3, marginBottom: 14 },
  heroName: { fontSize: 22, fontWeight: "800" },
  heroHandle: { fontSize: 13, fontWeight: "600" },
  heroDept: { fontSize: 12 },
  heroBio: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 4,
    paddingHorizontal: 20,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  editProfileText: { fontWeight: "700", fontSize: 14 },

  statsContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  statButton: {
    flex: 1,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statText: { fontSize: 14, fontWeight: "600" },
  statSeparator: { width: 1, marginVertical: 12 },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  menuSection: { marginBottom: 4 },
  menuGroup: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  itemDivider: { height: 1, marginLeft: 64 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 14,
  },
  logoutText: { fontSize: 15, fontWeight: "700" },
  version: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 18,
    marginBottom: 4,
    letterSpacing: 0.4,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: "92%",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  modalAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
  },
  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  modalAvatarImage: { width: 60, height: 60, borderRadius: 18, borderWidth: 2 },
  modalAvatarText: { fontSize: 20, fontWeight: "900" },
  modalAvatarHint: { fontSize: 14, fontWeight: "600" },
  avatarUploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  avatarUploadText: { fontSize: 14, fontWeight: "700" },
  modalLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 7,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  colorChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  modalBtnText: { fontSize: 15, fontWeight: "600" },
  modalBtnTextWhite: { color: "#fff", fontSize: 15, fontWeight: "700" },

  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingBottom: 10,
    paddingTop: 8,
  },
  navItem: { flex: 1, alignItems: "center", gap: 3 },
  navIconWrap: {
    width: 46,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: { fontSize: 10, letterSpacing: 0.2 },
});
