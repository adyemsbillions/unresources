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
  SafeAreaView,
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
import Svg, { Path } from "react-native-svg";
import { BottomNav, TopBar } from "./Home";

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

// ─── ICONS ──────────────────────────────────────────────────────────────────
const IconEdit = ({ color, size = 14 }) => (
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

const IconChevron = ({ color, size = 18 }) => (
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

const IconLogout = ({ color = "#f87171", size = 17 }) => (
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

function StatBox({ value, label, theme }) {
  return (
    <View style={[s.statBox, { backgroundColor: theme.card }]}>
      <Text style={[s.statNum, { color: theme.white }]}>{value}</Text>
      <Text style={[s.statLabel, { color: theme.faint }]}>{label}</Text>
    </View>
  );
}

function MenuItem({ item, theme }) {
  return (
    <TouchableOpacity style={s.menuItem} activeOpacity={0.72}>
      <View style={[s.menuIconBox, { backgroundColor: item.bg }]}>
        <Text style={s.menuEmoji}>{item.icon}</Text>
      </View>
      <Text style={[s.menuLabel, { color: theme.whiteMuted }]}>
        {item.label}
      </Text>
      {item.arrow && <IconChevron color={theme.faint} />}
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();
  const { user: passedUser } = useLocalSearchParams();

  // Theme state (saved in SecureStore)
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? darkTheme : lightTheme;

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Edit modal state
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

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      const saved = await SecureStore.getItemAsync("theme_preference");
      if (saved !== null) {
        setIsDark(saved === "dark");
      }
    };
    loadTheme();
  }, []);

  // Save theme when changed
  const toggleTheme = async () => {
    const newDark = !isDark;
    setIsDark(newDark);
    await SecureStore.setItemAsync(
      "theme_preference",
      newDark ? "dark" : "light",
    );
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        let userData = null;

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
        const updatedUser = {
          ...currentUser,
          ...body,
          full_name: body.name,
          color: body.accent_color,
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
          router.replace("/login"); // ← adjust if needed
        },
      },
    ]);
  };

  // Display values
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
      <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
        <ActivityIndicator
          size="large"
          color={theme.purpleGlow}
          style={{ flex: 1, justifyContent: "center" }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.bgDeep}
      />
      <TopBar />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.hero}>
          <View style={s.avatarWrap}>
            <View style={[s.avatar, { backgroundColor: avatarColor }]}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <TouchableOpacity
              style={s.editBtn}
              onPress={() => setEditModalVisible(true)}
            >
              <IconEdit color={theme.white} />
            </TouchableOpacity>
          </View>

          <Text style={[s.name, { color: theme.white }]}>{name}</Text>
          <Text style={[s.handle, { color: theme.purpleGlow }]}>
            {handleText} · {deptLevel}
          </Text>
          <Text style={[s.bio, { color: theme.whiteMuted }]}>{bioText}</Text>

          <TouchableOpacity
            style={s.editProfileBtn}
            onPress={() => setEditModalVisible(true)}
          >
            <Text style={[s.editProfileText, { color: theme.purpleGlow }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>

          {error && (
            <Text
              style={{ color: "#f87171", marginTop: 12, textAlign: "center" }}
            >
              {error}
            </Text>
          )}
        </View>

        {/* Theme Toggle Switch */}
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

        {/* Stats */}
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

        {/* Notifications */}
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

        {/* Menu Sections */}
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
                  {ii < section.items.length - 1 && (
                    <View
                      style={[s.itemDivider, { backgroundColor: theme.border }]}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity
          style={[
            s.logoutBtn,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={handleLogout}
        >
          <IconLogout color={theme.white} />
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[s.version, { color: theme.faint }]}>
          Unimaid Resources v1.0.0
        </Text>
      </ScrollView>

      {/* ── EDIT PROFILE MODAL ── */}
      <Modal
        animationType="fade"
        transparent={true}
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
            <View
              style={[s.modalOverlay, { backgroundColor: "rgba(0,0,0,0.88)" }]}
            >
              <View style={[s.modalContent, { backgroundColor: theme.card }]}>
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
                  />

                  <View style={s.modalButtons}>
                    <TouchableOpacity
                      style={[s.modalCancel, { backgroundColor: theme.border }]}
                      onPress={() => setEditModalVisible(false)}
                    >
                      <Text style={[s.modalButtonText, { color: theme.white }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.modalSave}
                      onPress={handleSaveProfile}
                    >
                      <Text style={s.modalButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
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
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  name: { fontSize: 23, fontWeight: "900", marginTop: 4 },
  handle: { fontSize: 13, fontStyle: "italic" },
  bio: { fontSize: 13, textAlign: "center", lineHeight: 20, marginTop: 2 },
  editProfileBtn: {
    marginTop: 10,
    paddingHorizontal: 28,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: "rgba(109,40,217,0.12)",
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
  },
  modalContent: {
    borderRadius: 24,
    width: "90%",
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
