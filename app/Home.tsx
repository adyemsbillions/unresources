/*
  File: app/Home.tsx
  Purpose: Unimaid Resources — Real Chats Home Screen
  Fix: Theme switching now actually works. C (static import) replaced with
       live T object that re-renders the whole screen when theme changes.
*/

import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
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

const API_BASE = "https://unresources.cravii.ng/api";

// ─── THEME DEFINITIONS ───────────────────────────────────────────────────────

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
    whiteMuted: "#4A4C70",
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
  avatar?: string;
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
  avatar?: string;
  online?: boolean;
};

// ─── UTILS ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  const clean = (name || "").trim();
  if (!clean) return "U";
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
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
  for (let i = 0; i < text.length; i++)
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── ICONS ───────────────────────────────────────────────────────────────────

function IconChat({ color, size = 21 }: { color: string; size?: number }) {
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

function IconStatus({ color, size = 21 }: { color: string; size?: number }) {
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

function IconMarket({ color, size = 21 }: { color: string; size?: number }) {
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

function IconProfile({ color, size = 21 }: { color: string; size?: number }) {
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

function IconSearch({ color, size = 17 }: { color: string; size?: number }) {
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

function IconEdit({ color, size = 18 }: { color: string; size?: number }) {
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
          ss.iconBtn,
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
            ss.themeDropdown,
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
                ss.themeOption,
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
                  ss.themeLabel,
                  {
                    color: current === t ? T.purpleGlow : T.whiteMuted,
                    fontWeight: current === t ? "700" : "500",
                  },
                ]}
              >
                {THEME_LABELS[t].label}
              </Text>
              {current === t && (
                <View
                  style={[ss.themeDot, { backgroundColor: T.purpleGlow }]}
                />
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "chats", label: "Chats", route: "/Home" },
  { id: "status", label: "Status", route: "/Status" },
  { id: "marketplace", label: "Market", route: "/Marketplace" },
  { id: "profile", label: "Profile", route: "/Profile" },
];

export function BottomNav({ active, T }: { active: string; T: Theme }) {
  const router = useRouter();
  return (
    <View
      style={[
        ss.bottomNav,
        { backgroundColor: T.navBg, borderTopColor: T.border },
      ]}
    >
      {NAV_ITEMS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={ss.navItem}
            onPress={() => router.replace(tab.route as any)}
            activeOpacity={0.7}
          >
            <View
              style={[
                ss.navIconWrap,
                isActive && { backgroundColor: T.purpleFaint },
              ]}
            >
              {tab.id === "chats" && (
                <IconChat color={isActive ? T.purpleGlow : T.faint} />
              )}
              {tab.id === "status" && (
                <IconStatus color={isActive ? T.purpleGlow : T.faint} />
              )}
              {tab.id === "marketplace" && (
                <IconMarket color={isActive ? T.purpleGlow : T.faint} />
              )}
              {tab.id === "profile" && (
                <IconProfile color={isActive ? T.purpleGlow : T.faint} />
              )}
            </View>
            <Text
              style={[
                ss.navLabel,
                {
                  color: isActive ? T.purpleGlow : T.faint,
                  fontWeight: isActive ? "700" : "600",
                },
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

// ─── TOP BAR ─────────────────────────────────────────────────────────────────

export function TopBar({
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
    <View style={[ss.topBar, { borderBottomColor: T.border }]}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={[ss.wordmark, { color: T.white }]}>
          {"UNIMAID "}
          <Text style={[ss.wordmarkAccent, { color: T.purpleGlow }]}>
            RESOURCES
          </Text>
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[ss.wordmarkSub, { color: T.faint }]}>
            University of Maiduguri
          </Text>
          {username ? (
            <>
              <Text style={{ color: T.faint, fontSize: 11 }}>·</Text>
              <Text style={[ss.usernameTag, { color: T.white }]}>
                @{username}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={ss.topActions}>
        <ThemeSwitcher current={theme} onChange={onThemeChange} T={T} />
        <TouchableOpacity
          style={[
            ss.iconBtn,
            { backgroundColor: T.card, borderColor: T.border },
          ]}
        >
          <IconBell color={T.whiteMuted} size={19} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────

function Avatar({
  initials,
  color,
  avatar,
  size = 50,
  radius = 16,
  online = false,
  T,
}: {
  initials: string;
  color: string;
  avatar?: string;
  size?: number;
  radius?: number;
  online?: boolean;
  T: Theme;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          ss.avatarBase,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: color,
            overflow: "hidden",
          },
        ]}
      >
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: radius,
            }}
          />
        ) : (
          <Text style={[ss.avatarText, { fontSize: size * 0.33 }]}>
            {initials}
          </Text>
        )}
      </View>
      {online ? (
        <View
          style={[
            ss.onlineDot,
            { backgroundColor: T.online, borderColor: T.bg },
          ]}
        />
      ) : null}
    </View>
  );
}

// ─── CHAT ROW ────────────────────────────────────────────────────────────────

function ChatRow({
  chat,
  onPress,
  T,
}: {
  chat: ChatItem;
  onPress: () => void;
  T: Theme;
}) {
  return (
    <TouchableOpacity style={ss.chatRow} activeOpacity={0.75} onPress={onPress}>
      <Avatar
        initials={chat.initials}
        color={chat.color}
        avatar={chat.avatar}
        online={chat.online}
        T={T}
      />

      <View style={ss.chatInfo}>
        <View style={ss.chatNameRow}>
          <Text style={[ss.chatName, { color: T.white }]} numberOfLines={1}>
            {chat.name}
          </Text>
          <Text style={[ss.chatTime, { color: T.faint }]}>{chat.time}</Text>
        </View>

        <View style={ss.previewRow}>
          <Text style={[ss.chatPreview, { color: T.faint }]} numberOfLines={1}>
            {chat.preview || "Start a conversation"}
          </Text>
          {chat.unread > 0 ? (
            <View style={[ss.unreadBadge, { backgroundColor: T.purpleMid }]}>
              <Text style={ss.unreadText}>{chat.unread}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={ss.chatMeta}>
        <Text style={[ss.chatTimeRight, { color: T.faint }]}>{chat.time}</Text>
        {chat.unread > 0 ? (
          <View style={[ss.unreadBadge, { backgroundColor: T.purpleMid }]}>
            <Text style={ss.unreadText}>{chat.unread}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── HOME SCREEN ─────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user: passedUser } = useLocalSearchParams();

  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const T: Theme = THEMES[themeMode];

  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [peopleMap, setPeopleMap] = useState<Record<string, SuggestionUser>>(
    {},
  );
  const [suggestions, setSuggestions] = useState<SuggestionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

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

  const loadPeopleMap = async () => {
    try {
      const res = await fetch(`${API_BASE}/get_people.php`);
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log("Invalid get_people response:", text);
        return {};
      }

      if (data.status === "success" && Array.isArray(data.users)) {
        const map: Record<string, SuggestionUser> = {};
        data.users.forEach((u: any) => {
          map[String(u.id)] = {
            id: u.id,
            username: u.username,
            full_name: u.full_name,
            initials: u.initials,
            color: u.color,
            avatar: u.avatar,
            online: false,
          };
        });
        setPeopleMap(map);
        return map;
      }

      return {};
    } catch (err) {
      console.error("People map error:", err);
      return {};
    }
  };

  const loadChatList = async (
    userId: string,
    mapArg?: Record<string, SuggestionUser>,
  ) => {
    try {
      const people = mapArg || peopleMap;

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
        const mapped: ChatItem[] = (data.chats || []).map((chat: any) => {
          const matchedPerson = people[String(chat.id)];

          return {
            id: chat.id,
            name: chat.name,
            initials:
              chat.initials ||
              matchedPerson?.initials ||
              getInitials(chat.name),
            color:
              chat.color || matchedPerson?.color || stringToColor(chat.name),
            avatar: matchedPerson?.avatar || "",
            online: !!chat.online,
            preview: chat.preview || "",
            time: chat.time || "",
            unread: Number(chat.unread || 0),
            pinned: false,
          };
        });

        setChats(mapped);
      }
    } catch (err) {
      console.error("Chat list error:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
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

        const map = await loadPeopleMap();
        await loadChatList(String(userData.id), map);
      } catch (err) {
        setError("Failed to load chats");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [passedUser]);

  useEffect(() => {
    if (!currentUserId) return;

    const interval = setInterval(() => {
      loadChatList(currentUserId);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUserId, peopleMap]);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/get_people.php?q=${encodeURIComponent(query.trim())}`,
        );
        const text = await res.text();
        let data;

        try {
          data = JSON.parse(text);
        } catch (e) {
          console.log("JSON ERROR:", e);
          console.log("SERVER RESPONSE:", text);
          setSuggestions([]);
          return;
        }

        if (data.status === "success") {
          setSuggestions(
            (data.users || [])
              .filter(
                (u: SuggestionUser) => String(u.id) !== String(currentUserId),
              )
              .map((u: any) => ({
                id: u.id,
                username: u.username,
                full_name: u.full_name,
                initials: u.initials,
                color: u.color,
                avatar: u.avatar,
                online: false,
              })),
          );
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
  if (query.trim())
    filteredChats = filteredChats.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase()),
    );
  if (activeFilter === "Unread")
    filteredChats = filteredChats.filter((c) => c.unread > 0);
  if (activeFilter === "Groups") filteredChats = [];

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
      <SafeAreaView
        style={[ss.safe, { backgroundColor: T.bg }]}
        edges={["top"]}
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

  if (error) {
    return (
      <SafeAreaView
        style={[ss.safe, { backgroundColor: T.bg }]}
        edges={["top"]}
      >
        <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />
        <Text style={{ color: "#f87171", textAlign: "center", marginTop: 100 }}>
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[ss.safe, { backgroundColor: T.bg }]} edges={["top"]}>
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />

      <View style={{ paddingTop: Platform.OS === "android" ? 2 : 0 }}>
        <TopBar
          username={displayUsername}
          theme={themeMode}
          onThemeChange={handleThemeChange}
          T={T}
        />
      </View>

      <View style={ss.filterRow}>
        {["All", "Unread", "Groups"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              ss.filterPill,
              {
                backgroundColor: activeFilter === t ? T.purpleFaint : T.card,
                borderColor: activeFilter === t ? T.purpleMid : T.border,
              },
            ]}
            // ─── changed part ────────────────────────────────────────
            onPress={() => {
              if (t === "Groups") {
                router.push("/groups");
              } else {
                setActiveFilter(t);
              }
            }}
          >
            <Text
              style={[
                ss.filterPillText,
                {
                  color: activeFilter === t ? T.purpleGlow : T.faint,
                  fontWeight: activeFilter === t ? "700" : "600",
                },
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ position: "relative" }}>
        <View
          style={[
            ss.searchBox,
            { backgroundColor: T.card, borderColor: T.border },
          ]}
        >
          <IconSearch color={T.faint} />
          <TextInput
            style={[ss.searchInput, { color: T.white }]}
            placeholder="Search people or chats"
            placeholderTextColor={T.faint}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {suggestions.length > 0 && query.trim().length > 0 ? (
          <View
            style={[
              ss.suggestionContainer,
              { backgroundColor: T.card, borderColor: T.border },
            ]}
          >
            <ScrollView nestedScrollEnabled style={{ maxHeight: 240 }}>
              {suggestions.map((user) => {
                const name = user.full_name || user.username;
                return (
                  <TouchableOpacity
                    key={String(user.id)}
                    style={[ss.suggestionRow, { borderBottomColor: T.border }]}
                    onPress={() => startNewChat(user)}
                  >
                    <Avatar
                      initials={user.initials || getInitials(name)}
                      color={user.color || stringToColor(name)}
                      avatar={user.avatar}
                      size={40}
                      radius={13}
                      online={!!user.online}
                      T={T}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[ss.suggestionName, { color: T.white }]}>
                        {name}
                      </Text>
                      <Text style={[ss.suggestionUsername, { color: T.faint }]}>
                        @{user.username}
                      </Text>
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
        <Text style={[ss.sectionLabel, { color: T.faint }]}>MESSAGES</Text>

        {filteredChats.length === 0 ? (
          <Text style={{ color: T.faint, textAlign: "center", marginTop: 40 }}>
            No chats yet
          </Text>
        ) : (
          filteredChats.map((chat) => (
            <ChatRow
              key={String(chat.id)}
              chat={chat}
              onPress={() => openChat(chat)}
              T={T}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          ss.fab,
          { backgroundColor: T.purpleMid, shadowColor: T.purpleMid },
        ]}
        activeOpacity={0.85}
        onPress={() => router.push("/people")}
      >
        <IconEdit color="#fff" size={19} />
      </TouchableOpacity>

      <BottomNav active="chats" T={T} />
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
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
  wordmarkAccent: { fontWeight: "900", letterSpacing: 0.8 },
  wordmarkSub: { fontSize: 11, marginTop: 2, letterSpacing: 0.4 },
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
    borderWidth: 1,
  },
  filterPillText: { fontSize: 13 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 14 },

  suggestionContainer: {
    position: "absolute",
    top: 54,
    left: 20,
    right: 20,
    borderRadius: 14,
    borderWidth: 1,
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
  },
  suggestionName: { fontWeight: "600", fontSize: 15 },
  suggestionUsername: { fontSize: 13 },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },

  avatarBase: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700" },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
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
    flex: 1,
    letterSpacing: 0.6,
    textTransform: "capitalize",
  },
  chatTime: { fontSize: 11 },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  chatPreview: { fontSize: 13, lineHeight: 18, flex: 1 },
  chatMeta: { alignItems: "flex-end", gap: 6 },
  chatTimeRight: { fontSize: 11 },
  unreadBadge: {
    borderRadius: 7,
    minWidth: 21,
    height: 19,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  fab: {
    position: "absolute",
    bottom: 84,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },

  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingBottom: 10,
    paddingTop: 8,
  },
  navItem: { flex: 1, alignItems: "center", gap: 4 },
  navIconWrap: {
    width: 46,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: { fontSize: 10, letterSpacing: 0.2 },
});
