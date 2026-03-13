/*
  File: app/people.tsx
  Purpose: Discover people and start chatting
  Fix: Theme switching works — uses live T from THEMES[themeMode] state
*/

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { BottomNav } from "./Home";

const API_BASE = "https://unresources.cravii.ng/api";

// ─── THEME SYSTEM (same as Home.tsx) ─────────────────────────────────────────

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

type Person = {
  id: number | string;
  username: string;
  full_name?: string;
  department?: string;
  faculty?: string;
  level?: string;
  matric_number?: string;
  bio?: string;
  status_text?: string;
  initials?: string;
  color?: string;
  avatar?: string;
  last_seen?: string;
};

// ─── UTILS ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  if (!name) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function stringToColor(text: string) {
  const colors = [
    "#7C3AED",
    "#2563EB",
    "#059669",
    "#DC2626",
    "#EA580C",
    "#0891B2",
  ];
  let hash = 0;
  for (let i = 0; i < text.length; i++)
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── ICONS ───────────────────────────────────────────────────────────────────

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

function IconSearch({ color, size = 17 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={1.9} />
      <Path
        d="M16.5 16.5L22 22"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
    </Svg>
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

// ─── TOP BAR (local — mirrors Home's TopBar with theme switcher) ──────────────

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
          {username ? (
            <>
              <Text style={{ color: T.faint, fontSize: 11 }}>·</Text>
              <Text style={[s.usernameTag, { color: T.white }]}>
                @{username}
              </Text>
            </>
          ) : null}
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

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function People() {
  const router = useRouter();

  // themeMode drives T — changing it instantly re-renders the whole screen
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const T: Theme = THEMES[themeMode];

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<Person | null>(null);
  const [viewVisible, setViewVisible] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    SecureStore.getItemAsync("theme")
      .then((saved) => {
        if (saved && THEMES[saved as ThemeMode])
          setThemeMode(saved as ThemeMode);
      })
      .catch(() => {});
  }, []);

  const handleThemeChange = (t: ThemeMode) => {
    setThemeMode(t); // instant re-render
    SecureStore.setItemAsync("theme", t).catch(() => {});
  };

  const loadPeople = async () => {
    try {
      setError("");
      const stored = await SecureStore.getItemAsync("user");
      let me = null;
      if (stored) {
        me = JSON.parse(stored);
        setCurrentUser(me);
      }

      const res = await fetch(`${API_BASE}/get_people.php`);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log("Invalid get_people response:", text);
        setError("Invalid server response");
        return;
      }

      if (data.status === "success") {
        const allUsers = Array.isArray(data.users) ? data.users : [];
        setPeople(
          me?.id
            ? allUsers.filter((u: Person) => String(u.id) !== String(me.id))
            : allUsers,
        );
      } else {
        setError(data.message || "Failed to load people");
      }
    } catch (err) {
      console.log(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeople();
  }, []);

  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => {
      const name = (p.full_name || p.username || "").toLowerCase();
      const username = (p.username || "").toLowerCase();
      const department = (p.department || "").toLowerCase();
      const level = (p.level || "").toLowerCase();
      const faculty = (p.faculty || "").toLowerCase();
      const matric = (p.matric_number || "").toLowerCase();
      return (
        name.includes(q) ||
        username.includes(q) ||
        department.includes(q) ||
        level.includes(q) ||
        faculty.includes(q) ||
        matric.includes(q)
      );
    });
  }, [people, query]);

  const openChat = (user: Person) => {
    const name = user.full_name || user.username;
    setViewVisible(false);
    router.push({
      pathname: "/ChatRoom",
      params: {
        id: `new_${user.id}`,
        name,
        initials: user.initials || getInitials(name),
        color: user.color || stringToColor(name),
        online: "0",
        userId: String(user.id),
        isNew: "true",
      },
    });
  };

  const openUserPopup = (user: Person) => {
    setSelectedUser(user);
    setViewVisible(true);
  };
  const closePopup = () => {
    setViewVisible(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: T.bg }]}>
        <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
        <ActivityIndicator size="large" color={T.purpleGlow} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />

      <TopBar
        username={currentUser?.username}
        theme={themeMode}
        onThemeChange={handleThemeChange}
        T={T}
      />

      {/* Search */}
      <View
        style={[
          s.searchBox,
          { backgroundColor: T.card, borderColor: T.border },
        ]}
      >
        <IconSearch color={T.faint} size={17} />
        <TextInput
          placeholder="Search people"
          placeholderTextColor={T.faint}
          value={query}
          onChangeText={setQuery}
          style={[s.searchInput, { color: T.white }]}
        />
      </View>

      {error ? <Text style={s.errorText}>{error}</Text> : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.sectionLabel, { color: T.faint }]}>PEOPLE</Text>

        {filteredPeople.length === 0 ? (
          <Text style={[s.emptyText, { color: T.faint }]}>No people found</Text>
        ) : (
          filteredPeople.map((user) => {
            const name = user.full_name || user.username;
            return (
              <TouchableOpacity
                key={String(user.id)}
                style={[s.personRow, { borderBottomColor: T.border }]}
                onPress={() => openUserPopup(user)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    s.avatar,
                    {
                      backgroundColor: user.color || stringToColor(name),
                    },
                  ]}
                >
                  <Text style={s.avatarText}>
                    {user.initials || getInitials(name)}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[s.name, { color: T.white }]}>{name}</Text>
                  <Text style={[s.username, { color: T.purpleGlow }]}>
                    @{user.username}
                  </Text>
                  {user.department || user.level ? (
                    <Text
                      style={[s.meta, { color: T.faint }]}
                      numberOfLines={1}
                    >
                      {[user.department, user.level]
                        .filter(Boolean)
                        .join(" • ")}
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[s.chatBtn, { backgroundColor: T.purpleMid }]}
                  onPress={() => openChat(user)}
                >
                  <Text style={s.chatBtnText}>CHAT</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Profile modal */}
      <Modal
        transparent
        visible={viewVisible}
        animationType="fade"
        onRequestClose={closePopup}
      >
        <TouchableWithoutFeedback onPress={closePopup}>
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  s.modalCard,
                  { backgroundColor: T.card, borderColor: T.border },
                ]}
              >
                {selectedUser &&
                  (() => {
                    const name =
                      selectedUser.full_name || selectedUser.username;
                    return (
                      <>
                        <View
                          style={[
                            s.modalAvatar,
                            {
                              backgroundColor:
                                selectedUser.color || stringToColor(name),
                            },
                          ]}
                        >
                          <Text style={s.modalAvatarText}>
                            {selectedUser.initials || getInitials(name)}
                          </Text>
                        </View>

                        <Text style={[s.modalName, { color: T.white }]}>
                          {name}
                        </Text>
                        <Text
                          style={[s.modalUsername, { color: T.purpleGlow }]}
                        >
                          @{selectedUser.username}
                        </Text>

                        {selectedUser.matric_number ? (
                          <Text style={[s.modalInfo, { color: T.whiteMuted }]}>
                            Matric Number: {selectedUser.matric_number}
                          </Text>
                        ) : null}

                        {selectedUser.department || selectedUser.level ? (
                          <Text style={[s.modalInfo, { color: T.whiteMuted }]}>
                            {[selectedUser.department, selectedUser.level]
                              .filter(Boolean)
                              .join(" • ")}
                          </Text>
                        ) : null}

                        {selectedUser.faculty ? (
                          <Text style={[s.modalInfo, { color: T.whiteMuted }]}>
                            Faculty: {selectedUser.faculty}
                          </Text>
                        ) : null}

                        {selectedUser.status_text ? (
                          <Text style={[s.modalStatus, { color: T.white }]}>
                            {selectedUser.status_text}
                          </Text>
                        ) : null}

                        {selectedUser.bio ? (
                          <Text style={[s.modalBio, { color: T.faint }]}>
                            {selectedUser.bio}
                          </Text>
                        ) : null}

                        <View style={s.modalButtons}>
                          <TouchableOpacity
                            style={[
                              s.modalBtnSecondary,
                              { borderColor: T.border },
                            ]}
                            onPress={closePopup}
                          >
                            <Text
                              style={[
                                s.modalBtnSecondaryText,
                                { color: T.white },
                              ]}
                            >
                              Close
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              s.modalBtnPrimary,
                              { backgroundColor: T.purpleMid },
                            ]}
                            onPress={() => openChat(selectedUser)}
                          >
                            <Text style={s.modalBtnPrimaryText}>Chat Now</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    );
                  })()}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <BottomNav active="chats" T={T} />
    </SafeAreaView>
  );
}

// ─── STYLES (layout only — zero hardcoded colors) ────────────────────────────

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

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 20,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 14 },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    paddingHorizontal: 20,
    paddingBottom: 8,
    textTransform: "uppercase",
  },

  personRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontWeight: "800" },
  name: {
    fontSize: 15,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  username: { fontSize: 13, marginTop: 2 },
  meta: { fontSize: 12, marginTop: 2 },
  chatBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  chatBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  emptyText: { textAlign: "center", marginTop: 40, fontSize: 14 },
  errorText: { color: "#f87171", textAlign: "center", marginBottom: 8 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  modalCard: {
    width: "100%",
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: "center",
  },
  modalAvatar: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalAvatarText: { color: "#fff", fontSize: 26, fontWeight: "900" },
  modalName: {
    fontSize: 20,
    fontWeight: "900",
    textTransform: "uppercase",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  modalUsername: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  modalInfo: { fontSize: 13, marginTop: 10, textAlign: "center" },
  modalStatus: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  modalBio: { fontSize: 13, marginTop: 8, textAlign: "center", lineHeight: 20 },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalBtnSecondary: {
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  modalBtnSecondaryText: { fontWeight: "700", fontSize: 13 },
  modalBtnPrimary: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  modalBtnPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
