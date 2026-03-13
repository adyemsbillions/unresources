/*
  File: app/Home.tsx
  Purpose: Unimaid Resources — Real Chats Home Screen
*/

import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
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
import { C } from "./constants/theme";

const API_BASE = "https://unresources.cravii.ng/api";

type UserType = {
  id: number | string;
  username?: string;
  full_name?: string;
  email?: string;
};

type ChatItem = {
  id: number | string;
  name: string;
  initials: string;
  color: string;
  online: boolean;
  preview: string;
  time: string;
  unread: number;
  pinned?: boolean;
};

type SuggestionUser = {
  id: number | string;
  username: string;
  full_name?: string;
  initials?: string;
  color?: string;
  online?: boolean;
};

function getInitials(name: string) {
  const clean = (name || "").trim();
  if (!clean) return "U";

  const parts = clean.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

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

function IconChat({ color = C.white, size = 21 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconStatus({ color = C.white, size = 21 }) {
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

function IconMarket({ color = C.white, size = 21 }) {
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

function IconProfile({ color = C.white, size = 21 }) {
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

function IconSearch({ color = C.faint, size = 17 }) {
  return (
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
}

function IconBell({ color = C.whiteMuted, size = 19 }) {
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

function IconEdit({ color = C.white, size = 18 }) {
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

const NAV_ITEMS = [
  { id: "chats", label: "Chats", route: "/Home", badge: 0 },
  { id: "status", label: "Status", route: "/Status", badge: 0 },
  { id: "marketplace", label: "Market", route: "/Marketplace", badge: 0 },
  { id: "profile", label: "Profile", route: "/Profile", badge: 0 },
];

function NavIcon({ id, color }: { id: string; color: string }) {
  if (id === "chats") return <IconChat color={color} />;
  if (id === "status") return <IconStatus color={color} />;
  if (id === "marketplace") return <IconMarket color={color} />;
  if (id === "profile") return <IconProfile color={color} />;
  return null;
}

function BottomNav({ active }: { active: string }) {
  const router = useRouter();

  return (
    <View style={s.bottomNav}>
      {NAV_ITEMS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={s.navItem}
            onPress={() => router.replace(tab.route as any)}
            activeOpacity={0.7}
          >
            <View style={[s.navIconWrap, isActive && s.navIconWrapActive]}>
              <NavIcon id={tab.id} color={isActive ? C.purpleGlow : C.faint} />
            </View>
            <Text style={[s.navLabel, isActive && s.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TopBar({ username }: { username?: string }) {
  return (
    <View style={s.topBar}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={s.wordmark}>
          {"UNIMAID "}
          <Text style={s.wordmarkAccent}>RESOURCES</Text>
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={s.wordmarkSub}>University of Maiduguri</Text>
          {username ? (
            <>
              <Text style={[s.wordmarkSub, { color: C.faint }]}>·</Text>
              <Text style={s.usernameTag}>@{username}</Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={s.topActions}>
        <TouchableOpacity style={s.iconBtn}>
          <IconSearch color={C.whiteMuted} size={17} />
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn}>
          <IconBell color={C.whiteMuted} size={19} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Avatar({
  initials,
  color,
  size = 50,
  radius = 16,
  online = false,
}: {
  initials: string;
  color: string;
  size?: number;
  radius?: number;
  online?: boolean;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          s.avatarBase,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: color,
          },
        ]}
      >
        <Text style={[s.avatarText, { fontSize: size * 0.33 }]}>
          {initials}
        </Text>
      </View>
      {online ? <View style={s.onlineDot} /> : null}
    </View>
  );
}

function ChatRow({ chat, onPress }: { chat: ChatItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.chatRow} activeOpacity={0.75} onPress={onPress}>
      <Avatar
        initials={chat.initials}
        color={chat.color}
        online={chat.online}
      />

      <View style={s.chatInfo}>
        <View style={s.chatNameRow}>
          <Text style={s.chatName} numberOfLines={1}>
            {chat.name}
          </Text>
          <Text style={s.chatTimeMobile}>{chat.time}</Text>
        </View>

        <View style={s.previewRow}>
          <Text style={s.chatPreview} numberOfLines={1}>
            {chat.preview || "Start a conversation"}
          </Text>
          {chat.unread > 0 ? (
            <View style={s.unreadBadge}>
              <Text style={s.unreadText}>{chat.unread}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={s.chatMeta}>
        <Text style={s.chatTime}>{chat.time}</Text>
        {chat.unread > 0 ? (
          <View style={s.unreadBadge}>
            <Text style={s.unreadText}>{chat.unread}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: passedUser } = useLocalSearchParams();

  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const loadChatList = async (userId: string) => {
    try {
      const res = await fetch(
        `${API_BASE}/get_chat_list.php?user_id=${encodeURIComponent(userId)}`,
      );
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log("Invalid get_chat_list response:", text);
        return;
      }

      if (data.status === "success") {
        const mapped: ChatItem[] = (data.chats || []).map((chat: any) => ({
          id: chat.id,
          name: chat.name,
          initials: chat.initials || getInitials(chat.name),
          color: chat.color || stringToColor(chat.name),
          online: !!chat.online,
          preview: chat.preview || "",
          time: chat.time || "",
          unread: Number(chat.unread || 0),
          pinned: false,
        }));

        setChats(mapped);
      }
    } catch (err) {
      console.error("Chat list error:", err);
    }
  };

  useEffect(() => {
    const loadUserAndChats = async () => {
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

        if (!userData?.id) {
          setError("No logged-in user found");
          setLoading(false);
          return;
        }

        setCurrentUser(userData);
        setCurrentUserId(String(userData.id));

        await loadChatList(String(userData.id));
      } catch (err) {
        setError("Failed to load chats");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadUserAndChats();
  }, [passedUser]);

  useEffect(() => {
    if (!currentUserId) return;

    const interval = setInterval(() => {
      loadChatList(currentUserId);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUserId]);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/search_users.php?q=${encodeURIComponent(query.trim())}`,
        );
        const text = await res.text();

        console.log("SERVER RESPONSE:", text);

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.log("JSON ERROR:", e);
          return;
        }

        if (data.status === "success") {
          const users = (data.users || []).filter(
            (u: SuggestionUser) => String(u.id) !== String(currentUserId),
          );
          setSuggestions(users);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Search error:", err);
        setSuggestions([]);
      }
    };

    const timeout = setTimeout(searchUsers, 400);
    return () => clearTimeout(timeout);
  }, [query, currentUserId]);

  const displayUsername = currentUser?.username;

  let filteredChats = [...chats];

  if (query.trim()) {
    filteredChats = filteredChats.filter((chat) =>
      chat.name.toLowerCase().includes(query.toLowerCase()),
    );
  }

  if (activeFilter === "Unread") {
    filteredChats = filteredChats.filter((chat) => chat.unread > 0);
  }

  if (activeFilter === "Groups") {
    filteredChats = [];
  }

  const openChat = (chat: ChatItem) => {
    router.push({
      pathname: "/ChatRoom",
      params: {
        id: String(chat.id),
        userId: String(chat.id),
        name: chat.name,
        initials: chat.initials,
        color: chat.color,
        online: chat.online ? "1" : "0",
      },
    });
  };

  const startNewChat = (user: SuggestionUser) => {
    const name = user.full_name || user.username;

    router.push({
      pathname: "/ChatRoom",
      params: {
        id: `new_${user.id}`,
        name,
        initials: user.initials || getInitials(name),
        color: user.color || stringToColor(name),
        online: user.online ? "1" : "0",
        userId: String(user.id),
        isNew: "true",
      },
    });

    setQuery("");
    setSuggestions([]);
    Keyboard.dismiss();
  };

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]} edges={["top"]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ActivityIndicator
          size="large"
          color={C.purpleGlow}
          style={{ flex: 1, justifyContent: "center" }}
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]} edges={["top"]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <Text style={{ color: "#f87171", textAlign: "center", marginTop: 100 }}>
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View
        style={{
          paddingTop: Platform.OS === "android" ? 2 : 0,
        }}
      >
        <TopBar username={displayUsername} />
      </View>

      <View style={s.filterRow}>
        {["All", "Unread", "Groups"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.filterPill, activeFilter === t && s.filterPillActive]}
            onPress={() => setActiveFilter(t)}
          >
            <Text
              style={[
                s.filterPillText,
                activeFilter === t && s.filterPillTextActive,
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ position: "relative" }}>
        <View style={s.searchBox}>
          <IconSearch color={C.faint} />
          <TextInput
            style={s.searchInput}
            placeholder="Search people or chats"
            placeholderTextColor={C.faint}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {suggestions.length > 0 && query.trim().length > 0 ? (
          <View style={s.suggestionContainer}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 240 }}>
              {suggestions.map((user) => {
                const name = user.full_name || user.username;
                return (
                  <TouchableOpacity
                    key={String(user.id)}
                    style={s.suggestionRow}
                    onPress={() => startNewChat(user)}
                  >
                    <Avatar
                      initials={user.initials || getInitials(name)}
                      color={user.color || stringToColor(name)}
                      size={40}
                      radius={13}
                      online={!!user.online}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={s.suggestionName}>{name}</Text>
                      <Text style={s.suggestionUsername}>@{user.username}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <Text style={s.sectionLabel}>MESSAGES</Text>

        {filteredChats.length === 0 ? (
          <Text style={{ color: C.faint, textAlign: "center", marginTop: 40 }}>
            No chats yet
          </Text>
        ) : (
          filteredChats.map((chat) => (
            <ChatRow
              key={String(chat.id)}
              chat={chat}
              onPress={() => openChat(chat)}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={s.fab} activeOpacity={0.85}>
        <IconEdit color={C.white} size={19} />
      </TouchableOpacity>

      <BottomNav active="chats" />
    </SafeAreaView>
  );
}

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  wordmark: {
    fontSize: 21,
    fontWeight: "900",
    color: C.white,
    letterSpacing: 0.6,
  },

  wordmarkAccent: {
    color: C.purpleGlow,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  wordmarkSub: {
    fontSize: 11,
    color: C.faint,
    marginTop: 2,
    letterSpacing: 0.4,
  },

  usernameTag: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 2,
  },

  topActions: { flexDirection: "row", gap: 8 },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },

  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },

  filterPillActive: {
    backgroundColor: C.purpleFaint,
    borderColor: C.purpleMid,
  },

  filterPillText: { color: C.faint, fontSize: 13, fontWeight: "600" },
  filterPillTextActive: { color: C.purpleGlow, fontWeight: "700" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
  },

  searchInput: { flex: 1, color: C.white, fontSize: 14 },

  suggestionContainer: {
    position: "absolute",
    top: 54,
    left: 20,
    right: 20,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    zIndex: 10,
    maxHeight: 240,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  suggestionName: {
    color: C.white,
    fontWeight: "600",
    fontSize: 15,
  },

  suggestionUsername: {
    color: C.faint,
    fontSize: 13,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: C.faint,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },

  avatarBase: { alignItems: "center", justifyContent: "center" },

  avatarText: { color: C.white, fontWeight: "700" },

  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.online,
    borderWidth: 2,
    borderColor: C.bg,
  },

  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 13,
  },

  chatInfo: { flex: 1, minWidth: 0 },

  chatNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 4,
  },

  chatName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    flex: 1,
    letterSpacing: 0.6,
    textTransform: "capitalize",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  chatPreview: {
    fontSize: 13,
    color: C.faint,
    lineHeight: 18,
    flex: 1,
  },

  chatMeta: {
    alignItems: "flex-end",
    gap: 6,
  },

  chatTime: {
    fontSize: 11,
    color: C.faint,
  },

  chatTimeMobile: {
    display: "none" as any,
  },

  unreadBadge: {
    backgroundColor: C.purpleMid,
    borderRadius: 7,
    minWidth: 21,
    height: 19,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },

  unreadText: {
    color: C.white,
    fontSize: 10,
    fontWeight: "700",
  },

  fab: {
    position: "absolute",
    bottom: 84,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: C.purpleMid,
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    shadowColor: C.purpleMid,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },

  bottomNav: {
    flexDirection: "row",
    backgroundColor: C.navBg || C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: 10,
    paddingTop: 8,
  },

  navItem: { flex: 1, alignItems: "center", gap: 4, position: "relative" },

  navIconWrap: {
    width: 46,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  navIconWrapActive: { backgroundColor: "rgba(109,40,217,0.28)" },

  navLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: C.faint,
    letterSpacing: 0.2,
  },

  navLabelActive: { color: C.purpleGlow, fontWeight: "700" },
});
