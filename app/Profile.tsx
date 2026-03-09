/*
  File: app/Profile.tsx
  Purpose: Unimaid Resources — Profile Screen
*/

import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { C } from "./constants/theme";
import { BottomNav, TopBar } from "./Home";

const API_BASE = "https://unresources.cravii.ng/api";

function IconEdit({ color = C.white, size = 14 }) {
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

function IconChevron({ color = C.faint, size = 18 }) {
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

function IconLogout({ color = "#f87171", size = 17 }) {
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
        strokeLinejoin="round"
      />
    </Svg>
  );
}

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

function StatBox({ value, label }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statNum}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ item }) {
  return (
    <TouchableOpacity style={s.menuItem} activeOpacity={0.72}>
      <View style={[s.menuIconBox, { backgroundColor: item.bg }]}>
        <Text style={s.menuEmoji}>{item.icon}</Text>
      </View>
      <Text style={s.menuLabel}>{item.label}</Text>
      {item.arrow && <IconChevron />}
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();
  const { user: passedUser } = useLocalSearchParams();

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        let userData = null;

        // 1. From login navigation params
        if (passedUser && typeof passedUser === "string") {
          userData = JSON.parse(passedUser);
          console.log("PROFILE - From params:", userData);
        }

        // 2. From SecureStore (persistent after login)
        if (!userData) {
          const stored = await SecureStore.getItemAsync("user");
          if (stored) {
            userData = JSON.parse(stored);
            console.log("PROFILE - From SecureStore:", userData);
          }
        }

        // 3. If still no data → error
        if (!userData) {
          setError("No user data found. Please log in again.");
          setLoading(false);
          return;
        }

        setCurrentUser(userData);
      } catch (err) {
        setError("Failed to load profile: " + err.message);
        console.error("Profile load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [passedUser]);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await SecureStore.deleteItemAsync("user");
            router.replace("/login"); // ← CHANGE THIS IF YOUR LOGIN ROUTE IS DIFFERENT
            // Examples:
            // router.replace("/");           // if login is app/index.tsx
            // router.replace("/(auth)/login"); // if inside group
          } catch (err) {
            console.error("Logout error:", err);
            Alert.alert("Error", "Could not sign out.");
          }
        },
      },
    ]);
  };

  // Display values with fallbacks
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
  const avatarColor = currentUser?.color || C.purpleMid;

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

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgDeep} />
      <TopBar />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.hero}>
          <View style={s.avatarWrap}>
            <View style={[s.avatar, { backgroundColor: avatarColor }]}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <TouchableOpacity style={s.editBtn}>
              <IconEdit />
            </TouchableOpacity>
          </View>

          <Text style={s.name}>{name}</Text>
          <Text style={s.handle}>
            {handleText} · {deptLevel}
          </Text>
          <Text style={s.bio}>{bioText}</Text>

          <TouchableOpacity style={s.editProfileBtn}>
            <Text style={s.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>

          {error && (
            <Text
              style={{ color: "#f87171", marginTop: 12, textAlign: "center" }}
            >
              {error}
            </Text>
          )}
        </View>

        <View style={s.statsCard}>
          <StatBox value="24" label="CHATS" />
          <View style={s.statDivider} />
          <StatBox value="7" label="LISTINGS" />
          <View style={s.statDivider} />
          <StatBox value="142" label="CONTACTS" />
        </View>

        <View style={s.toggleCard}>
          <View style={[s.menuIconBox, { backgroundColor: "#b45309" }]}>
            <Text style={s.menuEmoji}>🔔</Text>
          </View>
          <Text style={s.menuLabel}>Push Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: C.border, true: C.purpleMid }}
            thumbColor={notificationsEnabled ? C.purpleGlow : C.faint}
          />
        </View>

        {MENU_SECTIONS.map((section, si) => (
          <View key={si} style={s.menuSection}>
            <Text style={s.sectionLabel}>{section.title}</Text>
            <View style={s.menuGroup}>
              {section.items.map((item, ii) => (
                <View key={ii}>
                  <MenuItem item={item} />
                  {ii < section.items.length - 1 && (
                    <View style={s.itemDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <IconLogout />
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>Unimaid Resources v1.0.0</Text>
      </ScrollView>

      <BottomNav active="profile" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
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
  avatarText: { color: C.white, fontSize: 34, fontWeight: "900" },
  editBtn: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: C.purpleLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.bg,
  },
  name: { fontSize: 23, fontWeight: "900", color: C.white, marginTop: 4 },
  handle: { fontSize: 13, color: C.purpleGlow, fontStyle: "italic" },
  bio: {
    fontSize: 13,
    color: C.whiteMuted,
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
    borderColor: C.purpleMid,
    backgroundColor: "rgba(109,40,217,0.12)",
  },
  editProfileText: { color: C.purpleGlow, fontWeight: "700", fontSize: 14 },
  statsCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    overflow: "hidden",
  },
  statBox: { flex: 1, paddingVertical: 16, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: C.border, marginVertical: 12 },
  statNum: { fontSize: 22, fontWeight: "900", color: C.white },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: C.faint,
    marginTop: 2,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 13,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: C.faint,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  menuSection: { marginBottom: 4 },
  menuGroup: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
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
  itemDivider: { height: 1, backgroundColor: C.border, marginLeft: 64 },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  menuEmoji: { fontSize: 16 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: C.whiteSoft },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.25)",
    borderRadius: 14,
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#f87171" },
  version: {
    textAlign: "center",
    fontSize: 11,
    color: C.faint,
    marginTop: 20,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
});
