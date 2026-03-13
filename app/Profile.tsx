/*
  File: app/Profile.tsx
  Purpose: Unimaid Resources — Profile Screen with Light/Dark Mode Toggle & Edit Modal
*/

import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
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

// ─── THEME DEFINITIONS ──────────────────────────────────────────────────────
const lightTheme = {
  bg: "#FFFFFF",
  bgDeep: "#F8F9FA",
  card: "#F0F2F5",
  border: "#E0E0E0",
  inputBg: "#F8F9FA",
  white: "#000000",
  whiteMuted: "#333333",
  faint: "#666666",
  purpleGlow: "#7C3AED",
  purpleMid: "#6B2ED9",
  purpleLight: "#A78BFA",
  purpleFaint: "#F3E8FF",
  online: "#00C853",
};

const darkTheme = {
  bg: "#08080F",
  bgDeep: "#000000",
  card: "#0F0F1C",
  border: "#1C1C30",
  inputBg: "#070710",
  white: "#FFFFFF",
  whiteMuted: "#E5E5F0",
  faint: "#4B4B6B",
  purpleGlow: "#7C3AED",
  purpleMid: "#6B2ED9",
  purpleLight: "#A78BFA",
  purpleFaint: "#2A1A4D",
  online: "#00C853",
};

type ThemeType = typeof darkTheme;

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

// ─── ICONS ──────────────────────────────────────────────────────────────────
const IconEdit = ({ color, size = 14 }: { color: string; size?: number }) => (
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

const IconChevron = ({
  color,
  size = 18,
}: {
  color: string;
  size?: number;
}) => (
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

const IconLogout = ({
  color = "#f87171",
  size = 17,
}: {
  color?: string;
  size?: number;
}) => (
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
      strokeLinejoin="round"
    />
  </Svg>
);

const IconSearch = ({ color, size = 17 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={1.9} />
    <Line
      x1="16.5"
      y1="16.5"
      x2="22"
      y2="22"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
    />
  </Svg>
);

const IconBell = ({ color, size = 19 }: { color: string; size?: number }) => (
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

// ─── TOP BAR ────────────────────────────────────────────────────────────────
function ProfileTopBar({
  username,
  theme,
}: {
  username?: string;
  theme: ThemeType;
}) {
  return (
    <View
      style={[
        s.topBar,
        {
          backgroundColor: theme.bg,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={[s.wordmark, { color: theme.white }]}>
          PROFILE{" "}
          <Text style={[s.wordmarkAccent, { color: theme.purpleGlow }]}>
            SETTINGS
          </Text>
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[s.wordmarkSub, { color: theme.faint }]}>
            University of Maiduguri
          </Text>
          {username ? (
            <>
              <Text style={[s.wordmarkSub, { color: theme.faint }]}>·</Text>
              <Text
                style={[s.usernameTag, { color: theme.white }]}
                numberOfLines={1}
              >
                @{username}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={s.topActions}>
        <TouchableOpacity
          style={[
            s.iconBtn,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <IconSearch color={theme.whiteMuted} size={17} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.iconBtn,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <IconBell color={theme.whiteMuted} size={19} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── MENU & STAT ────────────────────────────────────────────────────────────
const MENU_SECTIONS = [
  {
    title: "ACCOUNT",
    items: [
      { icon: "📢", label: "Announcements", bg: "#5b21b6", arrow: true },
      { icon: "🛍️", label: "My Listings", bg: "#0e7490", arrow: true },
      { icon: "🔔", label: "Notifications", bg: "#b45309", arrow: true },
    ],
  },
  {
    title: "PREFERENCES",
    items: [
      { icon: "🔒", label: "Privacy & Security", bg: "#065f46", arrow: true },
      { icon: "🎨", label: "Appearance", bg: "#9d174d", arrow: true },
      { icon: "🌐", label: "Language", bg: "#1e3a5f", arrow: true },
    ],
  },
  {
    title: "SUPPORT",
    items: [
      { icon: "❓", label: "Help & Support", bg: "#4c1d95", arrow: true },
      { icon: "⭐", label: "Rate the App", bg: "#78350f", arrow: true },
    ],
  },
];

function StatBox({
  value,
  label,
  theme,
}: {
  value: string;
  label: string;
  theme: ThemeType;
}) {
  return (
    <View style={[s.statBox, { backgroundColor: theme.card }]}>
      <Text style={[s.statNum, { color: theme.white }]}>{value}</Text>
      <Text style={[s.statLabel, { color: theme.faint }]}>{label}</Text>
    </View>
  );
}

function MenuItem({
  item,
  theme,
}: {
  item: { icon: string; label: string; bg: string; arrow?: boolean };
  theme: ThemeType;
}) {
  return (
    <TouchableOpacity style={s.menuItem} activeOpacity={0.72}>
      <View style={[s.menuIconBox, { backgroundColor: item.bg }]}>
        <Text style={s.menuEmoji}>{item.icon}</Text>
      </View>
      <Text style={[s.menuLabel, { color: theme.whiteMuted }]}>
        {item.label}
      </Text>
      {item.arrow ? <IconChevron color={theme.faint} /> : null}
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: passedUser } = useLocalSearchParams();

  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? darkTheme : lightTheme;

  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await SecureStore.getItemAsync("theme_preference");
        if (saved !== null) {
          setIsDark(saved === "dark");
        }
      } catch (err) {
        console.log("Theme load error:", err);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newDark = !isDark;
      setIsDark(newDark);
      await SecureStore.setItemAsync(
        "theme_preference",
        newDark ? "dark" : "light",
      );
    } catch (err) {
      console.log("Theme save error:", err);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        let userData: UserType | null = null;

        if (passedUser && typeof passedUser === "string") {
          userData = JSON.parse(passedUser);
        }

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
            color: userData.color || "#7C3AED",
            avatar_url: userData.avatar_url || "",
          });
        } else {
          setError("No user data found. Please log in again.");
        }
      } catch (err) {
        setError("Failed to load profile.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [passedUser]);

  const handleSaveProfile = async () => {
    if (!currentUser?.id) {
      Alert.alert("Error", "No user ID found.");
      return;
    }

    try {
      const body = {
        user_id: currentUser.id,
        name: editForm.full_name,
        bio: editForm.bio,
        department: editForm.department,
        level: editForm.level,
        initials: editForm.initials,
        accent_color: editForm.color,
        profile_picture: editForm.avatar_url,
      };

      const res = await fetch(`${API_BASE}/update_profile.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        Alert.alert("Error", "Invalid server response.");
        return;
      }

      if (data.status === "success") {
        const updatedUser: UserType = {
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
        Alert.alert("Success", "Profile updated!");
      } else {
        Alert.alert("Error", data.message || "Failed to update.");
      }
    } catch (err) {
      Alert.alert("Error", "Network error.");
      console.error(err);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure?", [
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

  const name = currentUser?.full_name || currentUser?.username || "Guest";
  const handleText = currentUser?.username
    ? `@${currentUser.username}`
    : "@unknown";

  const bioText = currentUser?.bio || "No bio set yet.";
  const deptLevel =
    currentUser?.department && currentUser?.level
      ? `${currentUser.department} ${currentUser.level}`
      : "Unknown";

  const initials = currentUser?.initials || name.charAt(0).toUpperCase() || "?";
  const avatarColor = currentUser?.color || theme.purpleMid;

  if (loading) {
    return (
      <SafeAreaView
        style={[s.safe, { backgroundColor: theme.bg }]}
        edges={["top"]}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.bg}
        />
        <ActivityIndicator
          size="large"
          color={theme.purpleGlow}
          style={{ flex: 1, justifyContent: "center" }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[s.safe, { backgroundColor: theme.bg }]}
      edges={["top"]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.bg}
      />

      <View
        style={{
          paddingTop: Platform.OS === "android" ? 2 : 0,
        }}
      >
        <ProfileTopBar username={currentUser?.username} theme={theme} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 30, 40),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.hero}>
          <View style={s.avatarWrap}>
            <View style={[s.avatar, { backgroundColor: avatarColor }]}>
              <Text style={[s.avatarText, { color: theme.white }]}>
                {initials}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                s.editBtn,
                {
                  backgroundColor: theme.purpleMid,
                  borderColor: theme.bg,
                },
              ]}
              onPress={() => setEditModalVisible(true)}
            >
              <IconEdit color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={[s.name, { color: theme.white }]}>{name}</Text>
          <Text style={[s.handle, { color: theme.purpleGlow }]}>
            {handleText} · {deptLevel}
          </Text>
          <Text style={[s.bio, { color: theme.whiteMuted }]}>{bioText}</Text>

          <TouchableOpacity
            style={[
              s.editProfileBtn,
              {
                borderColor: theme.purpleMid,
                backgroundColor: theme.purpleFaint,
              },
            ]}
            onPress={() => setEditModalVisible(true)}
          >
            <Text style={[s.editProfileText, { color: theme.purpleGlow }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>

          {error ? (
            <Text
              style={{ color: "#f87171", marginTop: 12, textAlign: "center" }}
            >
              {error}
            </Text>
          ) : null}
        </View>

        <View
          style={[
            s.toggleCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View
            style={[
              s.menuIconBox,
              { backgroundColor: isDark ? "#FFD700" : "#4A90E2" },
            ]}
          >
            <Text style={s.menuEmoji}>{isDark ? "☀️" : "🌙"}</Text>
          </View>
          <Text style={[s.menuLabel, { color: theme.whiteMuted }]}>
            {isDark ? "Light Mode" : "Dark Mode"}
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: theme.purpleMid }}
            thumbColor={isDark ? theme.purpleGlow : theme.faint}
          />
        </View>

        <View
          style={[
            s.statsCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <StatBox value="24" label="CHATS" theme={theme} />
          <View style={[s.statDivider, { backgroundColor: theme.border }]} />
          <StatBox value="7" label="LISTINGS" theme={theme} />
          <View style={[s.statDivider, { backgroundColor: theme.border }]} />
          <StatBox value="142" label="CONTACTS" theme={theme} />
        </View>

        <View
          style={[
            s.toggleCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={[s.menuIconBox, { backgroundColor: "#b45309" }]}>
            <Text style={s.menuEmoji}>🔔</Text>
          </View>
          <Text style={[s.menuLabel, { color: theme.whiteMuted }]}>
            Push Notifications
          </Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: theme.border, true: theme.purpleMid }}
            thumbColor={notificationsEnabled ? theme.purpleGlow : theme.faint}
          />
        </View>

        {MENU_SECTIONS.map((section, si) => (
          <View key={si} style={s.menuSection}>
            <Text style={[s.sectionLabel, { color: theme.faint }]}>
              {section.title}
            </Text>
            <View
              style={[
                s.menuGroup,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              {section.items.map((item, ii) => (
                <View key={ii}>
                  <MenuItem item={item} theme={theme} />
                  {ii < section.items.length - 1 ? (
                    <View
                      style={[s.itemDivider, { backgroundColor: theme.border }]}
                    />
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[
            s.logoutBtn,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={handleLogout}
        >
          <IconLogout color={theme.white} />
          <Text style={[s.logoutText, { color: theme.white }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[s.version, { color: theme.faint }]}>
          Unimaid Resources v1.0.0
        </Text>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              setEditModalVisible(false);
            }}
          >
            <View style={s.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View
                  style={[
                    s.modalContent,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={s.modalScrollContent}
                  >
                    <Text style={[s.modalTitle, { color: theme.white }]}>
                      Edit Profile
                    </Text>

                    <Text style={[s.modalLabel, { color: theme.white }]}>
                      Full Name
                    </Text>
                    <TextInput
                      style={[
                        s.modalInput,
                        {
                          backgroundColor: theme.inputBg,
                          color: theme.white,
                          borderColor: theme.border,
                        },
                      ]}
                      value={editForm.full_name}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, full_name: text })
                      }
                      placeholder="Your full name"
                      placeholderTextColor={theme.faint}
                      autoCapitalize="words"
                    />

                    <Text style={[s.modalLabel, { color: theme.white }]}>
                      Bio
                    </Text>
                    <TextInput
                      style={[
                        s.modalInput,
                        {
                          minHeight: 100,
                          textAlignVertical: "top",
                          backgroundColor: theme.inputBg,
                          color: theme.white,
                          borderColor: theme.border,
                        },
                      ]}
                      value={editForm.bio}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, bio: text })
                      }
                      placeholder="Tell us about yourself..."
                      placeholderTextColor={theme.faint}
                      multiline
                    />

                    <Text style={[s.modalLabel, { color: theme.white }]}>
                      Department
                    </Text>
                    <TextInput
                      style={[
                        s.modalInput,
                        {
                          backgroundColor: theme.inputBg,
                          color: theme.white,
                          borderColor: theme.border,
                        },
                      ]}
                      value={editForm.department}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, department: text })
                      }
                      placeholder="e.g. Computer Science"
                      placeholderTextColor={theme.faint}
                    />

                    <Text style={[s.modalLabel, { color: theme.white }]}>
                      Level
                    </Text>
                    <TextInput
                      style={[
                        s.modalInput,
                        {
                          backgroundColor: theme.inputBg,
                          color: theme.white,
                          borderColor: theme.border,
                        },
                      ]}
                      value={editForm.level}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, level: text })
                      }
                      placeholder="e.g. 300L"
                      placeholderTextColor={theme.faint}
                    />

                    <Text style={[s.modalLabel, { color: theme.white }]}>
                      Initials (2 letters)
                    </Text>
                    <TextInput
                      style={[
                        s.modalInput,
                        {
                          backgroundColor: theme.inputBg,
                          color: theme.white,
                          borderColor: theme.border,
                        },
                      ]}
                      value={editForm.initials}
                      onChangeText={(text) =>
                        setEditForm({
                          ...editForm,
                          initials: text.toUpperCase().slice(0, 2),
                        })
                      }
                      placeholder="e.g. AE"
                      placeholderTextColor={theme.faint}
                      maxLength={2}
                      autoCapitalize="characters"
                    />

                    <Text style={[s.modalLabel, { color: theme.white }]}>
                      Accent Color (#HEX)
                    </Text>
                    <TextInput
                      style={[
                        s.modalInput,
                        {
                          backgroundColor: theme.inputBg,
                          color: theme.white,
                          borderColor: theme.border,
                        },
                      ]}
                      value={editForm.color}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, color: text })
                      }
                      placeholder="#7C3AED"
                      placeholderTextColor={theme.faint}
                    />

                    <Text style={[s.modalLabel, { color: theme.white }]}>
                      Avatar URL (optional)
                    </Text>
                    <TextInput
                      style={[
                        s.modalInput,
                        {
                          backgroundColor: theme.inputBg,
                          color: theme.white,
                          borderColor: theme.border,
                        },
                      ]}
                      value={editForm.avatar_url}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, avatar_url: text })
                      }
                      placeholder="https://example.com/avatar.jpg"
                      placeholderTextColor={theme.faint}
                    />

                    <View style={s.modalButtons}>
                      <TouchableOpacity
                        style={[
                          s.modalCancel,
                          { backgroundColor: theme.border },
                        ]}
                        onPress={() => setEditModalVisible(false)}
                      >
                        <Text
                          style={[s.modalButtonText, { color: theme.white }]}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          s.modalSave,
                          { backgroundColor: theme.purpleMid },
                        ]}
                        onPress={handleSaveProfile}
                      >
                        <Text style={[s.modalButtonText, { color: "#FFFFFF" }]}>
                          Save Changes
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <BottomNav active="profile" />
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

  wordmark: {
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  wordmarkAccent: {
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  wordmarkSub: {
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.4,
  },

  usernameTag: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 2,
  },

  topActions: { flexDirection: "row", gap: 8 },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  hero: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 6,
  },

  avatarWrap: { position: "relative", marginBottom: 4 },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "rgba(139,92,246,0.45)",
  },

  avatarText: { fontSize: 34, fontWeight: "900" },

  editBtn: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },

  name: { fontSize: 23, fontWeight: "900", marginTop: 4 },

  handle: {
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
  },

  bio: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 2,
  },

  editProfileBtn: {
    marginTop: 10,
    paddingHorizontal: 28,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },

  editProfileText: { fontWeight: "700", fontSize: 14 },

  statsCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },

  statBox: { flex: 1, paddingVertical: 16, alignItems: "center" },

  statDivider: { width: 1, marginVertical: 12 },

  statNum: { fontSize: 22, fontWeight: "900" },

  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
  },

  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 13,
    borderWidth: 1,
    borderRadius: 14,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },

  menuSection: { marginBottom: 4 },

  menuGroup: {
    marginHorizontal: 20,
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

  itemDivider: { height: 1, marginLeft: 64 },

  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  menuEmoji: { fontSize: 16 },

  menuLabel: { flex: 1, fontSize: 14, fontWeight: "600" },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 14,
  },

  logoutText: { fontSize: 15, fontWeight: "700" },

  version: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 20,
    marginBottom: 4,
    letterSpacing: 0.4,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.88)",
    paddingHorizontal: 12,
  },

  modalContent: {
    borderRadius: 24,
    width: "100%",
    maxWidth: 420,
    maxHeight: "82%",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 25,
  },

  modalScrollContent: { paddingBottom: 60 },

  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },

  modalLabel: { fontSize: 14, marginBottom: 8, fontWeight: "600" },

  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    gap: 16,
  },

  modalCancel: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  modalSave: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  modalButtonText: { fontSize: 16, fontWeight: "700" },
});
