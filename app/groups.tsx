/*
  File: app/groups.tsx
  Purpose: Public groups list + create group + join/open group
*/

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
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

type GroupItem = {
  id: number | string;
  name: string;
  description?: string;
  photo?: string | null;
  created_by?: number | string;
  created_at?: string;
  member_count: number;
  joined: boolean;
};

function getInitials(name: string) {
  if (!name) return "G";
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
    "#DB2777",
    "#4F46E5",
  ];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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

function IconUsers({ color, size = 17 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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

export default function Groups() {
  const router = useRouter();

  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const T: Theme = THEMES[themeMode];

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState<string>("");
  const [error, setError] = useState("");

  const [createVisible, setCreateVisible] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  useEffect(() => {
    SecureStore.getItemAsync("theme")
      .then((saved) => {
        if (saved && THEMES[saved as ThemeMode]) {
          setThemeMode(saved as ThemeMode);
        }
      })
      .catch(() => {});
  }, []);

  const loadGroups = async (searchText = "") => {
    try {
      setError("");

      const stored = await SecureStore.getItemAsync("user");
      let me = null;
      if (stored) {
        me = JSON.parse(stored);
        setCurrentUser(me);
      }

      const userId = me?.id ? String(me.id) : "0";

      const url =
        `${API_BASE}/groups.php?action=list&user_id=${encodeURIComponent(userId)}` +
        (searchText.trim()
          ? `&q=${encodeURIComponent(searchText.trim())}`
          : "");

      const res = await fetch(url);
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log("groups list invalid response:", text);
        setError("Invalid server response");
        return;
      }

      if (data.status === "success") {
        setGroups(Array.isArray(data.groups) ? data.groups : []);
      } else {
        setError(data.message || "Failed to load groups");
      }
    } catch (err) {
      console.log("loadGroups failed:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadGroups(query);
    }, 450);

    return () => clearTimeout(timer);
  }, [query]);

  const createGroup = async () => {
    if (!groupName.trim()) {
      setError("Enter group name");
      return;
    }

    if (!currentUser?.id) {
      setError("User not found");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const res = await fetch(`${API_BASE}/groups.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: groupName.trim(),
          description: groupDescription.trim(),
          created_by: Number(currentUser.id),
        }),
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log("createGroup invalid response:", text);
        setError("Invalid server response");
        return;
      }

      if (data.status === "success") {
        setCreateVisible(false);
        setGroupName("");
        setGroupDescription("");
        await loadGroups(query);

        router.push({
          pathname: "/GroupChatRoom",
          params: {
            groupId: String(data.group_id),
            groupName: groupName.trim(),
          },
        });
      } else {
        setError(data.message || "Could not create group");
      }
    } catch (err) {
      console.log("createGroup failed:", err);
      setError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const joinGroup = async (group: GroupItem) => {
    if (!currentUser?.id) {
      setError("User not found");
      return;
    }

    try {
      setJoiningId(String(group.id));
      setError("");

      const res = await fetch(`${API_BASE}/groups.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          group_id: Number(group.id),
          user_id: Number(currentUser.id),
        }),
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log("joinGroup invalid response:", text);
        setError("Invalid server response");
        return;
      }

      if (data.status === "success") {
        await loadGroups(query);

        router.push({
          pathname: "/GroupChatRoom",
          params: {
            groupId: String(group.id),
            groupName: group.name,
          },
        });
      } else {
        setError(data.message || "Could not join group");
      }
    } catch (err) {
      console.log("joinGroup failed:", err);
      setError("Network error");
    } finally {
      setJoiningId("");
    }
  };

  const openGroup = (group: GroupItem) => {
    router.push({
      pathname: "/GroupChatRoom",
      params: {
        groupId: String(group.id),
        groupName: group.name,
      },
    });
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

      <View style={[s.topBar, { borderBottomColor: T.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: T.white }]}>GROUPS</Text>
          <Text style={[s.subTitle, { color: T.faint }]}>
            Join or create public groups
          </Text>
        </View>

        <TouchableOpacity
          style={[s.createBtn, { backgroundColor: T.purpleMid }]}
          onPress={() => setCreateVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={s.createBtnText}>NEW</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          s.searchBox,
          { backgroundColor: T.card, borderColor: T.border },
        ]}
      >
        <IconSearch color={T.faint} size={17} />
        <TextInput
          placeholder="Search groups"
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
        <Text style={[s.sectionLabel, { color: T.faint }]}>PUBLIC GROUPS</Text>

        {groups.length === 0 ? (
          <Text style={[s.emptyText, { color: T.faint }]}>No groups found</Text>
        ) : (
          groups.map((group) => {
            const avatarColor = stringToColor(group.name);

            return (
              <TouchableOpacity
                key={String(group.id)}
                style={[s.groupRow, { borderBottomColor: T.border }]}
                onPress={() =>
                  group.joined ? openGroup(group) : joinGroup(group)
                }
                activeOpacity={0.82}
              >
                <View
                  style={[s.avatar, { backgroundColor: avatarColor + "22" }]}
                >
                  {group.photo ? (
                    <Image
                      source={{ uri: group.photo }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 14,
                      }}
                    />
                  ) : (
                    <Text style={[s.avatarText, { color: avatarColor }]}>
                      {getInitials(group.name)}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[s.groupName, { color: T.white }]}>
                    {group.name}
                  </Text>

                  {group.description ? (
                    <Text
                      style={[s.groupDescription, { color: T.whiteMuted }]}
                      numberOfLines={2}
                    >
                      {group.description}
                    </Text>
                  ) : null}

                  <View style={s.metaRow}>
                    <IconUsers color={T.faint} size={14} />
                    <Text style={[s.metaText, { color: T.faint }]}>
                      {group.member_count} member
                      {group.member_count === 1 ? "" : "s"}
                    </Text>
                  </View>
                </View>

                {group.joined ? (
                  <TouchableOpacity
                    style={[s.openBtn, { backgroundColor: T.purpleMid }]}
                    onPress={() => openGroup(group)}
                    activeOpacity={0.85}
                  >
                    <Text style={s.openBtnText}>OPEN</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[s.joinBtn, { borderColor: T.purpleMid }]}
                    onPress={() => joinGroup(group)}
                    activeOpacity={0.85}
                    disabled={joiningId === String(group.id)}
                  >
                    <Text style={[s.joinBtnText, { color: T.purpleGlow }]}>
                      {joiningId === String(group.id) ? "JOINING..." : "JOIN"}
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal
        transparent
        visible={createVisible}
        animationType="fade"
        onRequestClose={() => setCreateVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCreateVisible(false)}>
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  s.modalCard,
                  { backgroundColor: T.card, borderColor: T.border },
                ]}
              >
                <Text style={[s.modalTitle, { color: T.white }]}>
                  Create Group
                </Text>

                <TextInput
                  placeholder="Group name"
                  placeholderTextColor={T.faint}
                  value={groupName}
                  onChangeText={setGroupName}
                  style={[
                    s.modalInput,
                    {
                      color: T.white,
                      borderColor: T.border,
                      backgroundColor: T.bg,
                    },
                  ]}
                />

                <TextInput
                  placeholder="Description"
                  placeholderTextColor={T.faint}
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  multiline
                  style={[
                    s.modalTextarea,
                    {
                      color: T.white,
                      borderColor: T.border,
                      backgroundColor: T.bg,
                    },
                  ]}
                />

                <View style={s.modalButtons}>
                  <TouchableOpacity
                    style={[s.modalBtnSecondary, { borderColor: T.border }]}
                    onPress={() => setCreateVisible(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={[s.modalBtnSecondaryText, { color: T.white }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      s.modalBtnPrimary,
                      { backgroundColor: T.purpleMid },
                    ]}
                    onPress={createGroup}
                    disabled={creating}
                    activeOpacity={0.85}
                  >
                    <Text style={s.modalBtnPrimaryText}>
                      {creating ? "Creating..." : "Create"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <BottomNav active="chats" T={T} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  subTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  createBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.5,
  },

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

  groupRow: {
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
    overflow: "hidden",
  },
  avatarText: {
    fontWeight: "900",
    fontSize: 16,
  },
  groupName: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  groupDescription: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
  },

  joinBtn: {
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 10,
  },
  joinBtnText: {
    fontWeight: "800",
    fontSize: 12,
  },
  openBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 10,
  },
  openBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
  },
  errorText: {
    color: "#f87171",
    textAlign: "center",
    marginBottom: 8,
  },

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
    paddingVertical: 22,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 14,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 14,
  },
  modalTextarea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    marginBottom: 14,
    fontSize: 14,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalBtnSecondary: {
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  modalBtnSecondaryText: {
    fontWeight: "700",
    fontSize: 13,
  },
  modalBtnPrimary: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  modalBtnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
});
