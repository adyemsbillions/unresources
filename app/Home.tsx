/*
  File: app/Home.tsx  ← or app/index.tsx if this is your entry route
  Purpose: Unimaid Resources — Chats Screen + Bottom Nav Shell
  Routing: Expo Router
*/

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { C, CHATS } from "./constants/theme";

// ─── SVG ICONS ───────────────────────────────────────────────────────────────

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

function IconSearch({
  color = C.faint,
  size = 17,
}: {
  color?: string;
  size?: number;
}) {
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

function IconBell({
  color = C.whiteMuted,
  size = 19,
}: {
  color?: string;
  size?: number;
}) {
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

function IconEdit({
  color = C.white,
  size = 18,
}: {
  color?: string;
  size?: number;
}) {
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

function IconPin({
  color = C.purpleGlow,
  size = 12,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2.5 6H20l-5 3.5 2 6.5L12 14l-5 4 2-6.5L4 8h5.5z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── BOTTOM NAV (shared shell, defined once here) ────────────────────────────

const NAV_ITEMS = [
  { id: "chats", label: "Chats", route: "/Home", badge: 3 },
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

export function BottomNav({ active }: { active: string }) {
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
            {tab.badge > 0 && (
              <View style={s.navBadge}>
                <Text style={s.navBadgeText}>{tab.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── TOP BAR (shared) ────────────────────────────────────────────────────────

export function TopBar({
  title,
  subtitle,
  username,
}: {
  title?: string;
  subtitle?: string;
  username?: string;
}) {
  return (
    <View style={s.topBar}>
      <View>
        <Text style={s.wordmark}>
          {"unimaid "}
          <Text style={s.wordmarkAccent}>resources</Text>
        </Text>

        {/* Updated: show username next to university name */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={s.wordmarkSub}>
            {subtitle ?? "University of Maiduguri"}
          </Text>
          {username && (
            <>
              <Text style={[s.wordmarkSub, { color: C.faint }]}>·</Text>
              <Text
                style={[
                  s.wordmarkSub,
                  { color: C.purpleGlow, fontWeight: "700" },
                ]}
              >
                @{username}
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={s.topActions}>
        <TouchableOpacity style={s.iconBtn}>
          <IconSearch color={C.whiteMuted} size={17} />
        </TouchableOpacity>
        <View>
          <TouchableOpacity style={s.iconBtn}>
            <IconBell color={C.whiteMuted} size={19} />
          </TouchableOpacity>
          <View style={s.topBadge}>
            <Text style={s.topBadgeText}>3</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── AVATAR (shared) ─────────────────────────────────────────────────────────

export function Avatar({
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
      {online && <View style={s.onlineDot} />}
    </View>
  );
}

// ─── CHAT ROW ────────────────────────────────────────────────────────────────

function ChatRow({
  chat,
  onPress,
}: {
  chat: (typeof CHATS)[0];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.chatRow} activeOpacity={0.7} onPress={onPress}>
      <Avatar
        initials={chat.initials}
        color={chat.color}
        online={chat.online}
      />
      <View style={s.chatInfo}>
        <View style={s.chatNameRow}>
          <Text style={s.chatName}>{chat.name}</Text>
          {chat.pinned && <IconPin />}
        </View>
        <Text style={s.chatPreview} numberOfLines={1}>
          {chat.preview}
        </Text>
      </View>
      <View style={s.chatMeta}>
        <Text style={s.chatTime}>{chat.time}</Text>
        {chat.unread > 0 && (
          <View style={s.unreadBadge}>
            <Text style={s.unreadText}>{chat.unread}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { user } = useLocalSearchParams(); // passed from login screen

  const [currentUser, setCurrentUser] = useState<{
    username?: string;
    full_name?: string;
    initials?: string;
    color?: string;
    online?: boolean;
  } | null>(null);

  // Parse user data passed from login
  useEffect(() => {
    if (user && typeof user === "string") {
      try {
        const parsedUser = JSON.parse(user);
        setCurrentUser(parsedUser);
      } catch (err) {
        console.warn("Failed to parse user data from navigation params", err);
      }
    }
  }, [user]);

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // Determine what to display as username
  const displayUsername =
    currentUser?.username ||
    (currentUser?.full_name
      ? currentUser.full_name.split(" ")[0].toLowerCase()
      : undefined);

  const pinned = CHATS.filter(
    (c) => c.pinned && c.name.toLowerCase().includes(query.toLowerCase()),
  );
  const recent = CHATS.filter(
    (c) => !c.pinned && c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const openChat = (chat: (typeof CHATS)[0]) => {
    router.push({
      pathname: "/ChatRoom",
      params: {
        id: String(chat.id),
        name: chat.name,
        initials: chat.initials,
        color: chat.color,
        online: chat.online ? "1" : "0",
      },
    });
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgDeep} />

      {/* Top bar with username */}
      <TopBar username={displayUsername} />

      {/* Filter Pills */}
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

      {/* Search */}
      <View style={s.searchBox}>
        <IconSearch />
        <TextInput
          style={s.searchInput}
          placeholder="Search conversations…"
          placeholderTextColor={C.faint}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Chat List */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {pinned.length > 0 && (
          <>
            <Text style={s.sectionLabel}>PINNED</Text>
            {pinned.map((chat) => (
              <ChatRow
                key={chat.id}
                chat={chat}
                onPress={() => openChat(chat)}
              />
            ))}
            <View style={s.divider} />
          </>
        )}
        <Text style={s.sectionLabel}>MESSAGES</Text>
        {recent.map((chat) => (
          <ChatRow key={chat.id} chat={chat} onPress={() => openChat(chat)} />
        ))}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Compose FAB */}
      <TouchableOpacity style={s.fab} activeOpacity={0.85}>
        <IconEdit color={C.white} size={19} />
      </TouchableOpacity>

      <BottomNav active="chats" />
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  wordmark: {
    fontSize: 19,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.3,
  },
  wordmarkAccent: { color: C.purpleGlow, fontWeight: "800" },
  wordmarkSub: {
    fontSize: 11,
    color: C.faint,
    marginTop: 1,
    letterSpacing: 0.3,
  },
  topActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  topBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: C.purpleMid,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.bg,
  },
  topBadgeText: { color: C.white, fontSize: 8, fontWeight: "700" },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, color: C.white, fontSize: 14 },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: C.faint,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 20,
    marginVertical: 6,
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
    paddingVertical: 11,
    gap: 13,
  },
  chatInfo: { flex: 1 },
  chatNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  chatName: { fontSize: 15, fontWeight: "700", color: C.whiteSoft },
  chatPreview: {
    fontSize: 13,
    color: C.faint,
    fontStyle: "italic",
    lineHeight: 18,
  },
  chatMeta: { alignItems: "flex-end", gap: 5 },
  chatTime: { fontSize: 11, color: C.faint },
  unreadBadge: {
    backgroundColor: C.purpleMid,
    borderRadius: 7,
    minWidth: 21,
    height: 19,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: { color: C.white, fontSize: 10, fontWeight: "700" },

  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.purpleMid,
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    shadowColor: C.purpleMid,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },

  // Bottom Nav (exported so other screens can copy the same styles)
  bottomNav: {
    flexDirection: "row",
    backgroundColor: C.navBg,
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
  navBadge: {
    position: "absolute",
    top: 0,
    right: 10,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.purpleMid,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.navBg,
  },
  navBadgeText: { color: C.white, fontSize: 8, fontWeight: "700" },
});
