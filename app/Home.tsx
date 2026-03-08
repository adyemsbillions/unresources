/*
  File: app/Home.tsx  (or app/index.tsx if this is your entry screen)
  Purpose: Unimaid Resources — Main Dashboard
  Routing: Expo Router (useRouter + href)
*/

import { useRouter } from "expo-router";
import React, { useState } from "react";
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

// ─── THEME ───────────────────────────────────────────────────────────────────

const C = {
  bg: "#0d0618",
  bgDeep: "#080412",
  card: "rgba(255,255,255,0.055)" as const,
  border: "rgba(255,255,255,0.09)" as const,
  purple: "#6d28d9",
  purpleMid: "#7c3aed",
  purpleLight: "#8b5cf6",
  purpleGlow: "#a78bfa",
  purpleFaint: "rgba(109,40,217,0.18)" as const,
  white: "#ffffff",
  whiteSoft: "rgba(255,255,255,0.88)" as const,
  whiteMuted: "rgba(255,255,255,0.55)" as const,
  faint: "rgba(255,255,255,0.32)" as const,
  online: "#10d9a0",
  navBg: "#0a0415" as const,
};

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

function IconChevron({
  color = C.faint,
  size = 18,
}: {
  color?: string;
  size?: number;
}) {
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

function IconPlus({
  color = C.white,
  size = 20,
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
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
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

// ─── DATA ────────────────────────────────────────────────────────────────────

export const CHATS = [
  {
    id: 1,
    name: "Study Group 300L",
    preview: "Don't forget the assignment deadline tmr",
    time: "09:42",
    unread: 5,
    initials: "SG",
    color: "#6d28d9",
    online: true,
    pinned: true,
  },
  {
    id: 2,
    name: "Amaka Obi",
    preview: "I'll send you the notes right now",
    time: "09:18",
    unread: 2,
    initials: "AO",
    color: "#be185d",
    online: true,
    pinned: false,
  },
  {
    id: 3,
    name: "CSC Department",
    preview: "Lecture moved to LT3 tomorrow",
    time: "Yesterday",
    unread: 12,
    initials: "CS",
    color: "#0e7490",
    online: false,
    pinned: false,
  },
  {
    id: 4,
    name: "Tunde Bello",
    preview: "Did you collect the form already?",
    time: "Yesterday",
    unread: 0,
    initials: "TB",
    color: "#b45309",
    online: false,
    pinned: false,
  },
  {
    id: 5,
    name: "Hostel Block D",
    preview: "Water is back on everyone!",
    time: "Mon",
    unread: 3,
    initials: "HD",
    color: "#065f46",
    online: true,
    pinned: false,
  },
  {
    id: 6,
    name: "Fatima Usman",
    preview: "See you at the library at 4pm",
    time: "Mon",
    unread: 0,
    initials: "FU",
    color: "#5b21b6",
    online: false,
    pinned: false,
  },
  {
    id: 7,
    name: "Assignments 400L",
    preview: "Has anyone done question 3b yet?",
    time: "Sun",
    unread: 7,
    initials: "AS",
    color: "#1e40af",
    online: false,
    pinned: false,
  },
];

const STATUSES = [
  { name: "Amaka", initials: "AO", color: "#be185d", seen: false },
  { name: "CSC Dept", initials: "CS", color: "#0e7490", seen: false },
  { name: "Tunde", initials: "TB", color: "#b45309", seen: true },
  { name: "Fatima", initials: "FU", color: "#5b21b6", seen: true },
  { name: "Ibrahim", initials: "IB", color: "#065f46", seen: false },
];

const MARKET = [
  {
    title: "Texas Instruments TI-84",
    price: "18,500",
    seller: "Chidi O.",
    emoji: "🧮",
    bg: "#1e1b4b",
  },
  {
    title: "200L Chemistry Notes",
    price: "2,000",
    seller: "Amaka U.",
    emoji: "📚",
    bg: "#1a1a2e",
  },
  {
    title: "Mini Fridge (barely used)",
    price: "35,000",
    seller: "Final Year",
    emoji: "🧊",
    bg: "#0f172a",
  },
  {
    title: "Laptop Charger 65W",
    price: "7,800",
    seller: "Tunde B.",
    emoji: "🔌",
    bg: "#1c1917",
  },
  {
    title: "Biochem Textbook 3rd Ed",
    price: "5,500",
    seller: "Sara M.",
    emoji: "🔬",
    bg: "#142010",
  },
  {
    title: "Engineering Drawing Set",
    price: "4,200",
    seller: "Emeka K.",
    emoji: "📐",
    bg: "#1a100a",
  },
];

const MENU = [
  { icon: "📢", label: "Announcements", bg: "#5b21b6" },
  { icon: "🛍️", label: "My Listings", bg: "#0e7490" },
  { icon: "🔔", label: "Notifications", bg: "#b45309" },
  { icon: "🔒", label: "Privacy & Security", bg: "#065f46" },
  { icon: "🎨", label: "Appearance", bg: "#9d174d" },
  { icon: "❓", label: "Help & Support", bg: "#4c1d95" },
];

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

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
      {online && <View style={s.onlineDot} />}
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={s.sectionLabel}>{label}</Text>;
}

function Divider() {
  return <View style={s.divider} />;
}

// ─── CHATS TAB ───────────────────────────────────────────────────────────────

function ChatsTab() {
  const router = useRouter();
  const [query, setQuery] = useState("");

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
    <View style={{ flex: 1 }}>
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

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {pinned.length > 0 && (
          <>
            <SectionLabel label="PINNED" />
            {pinned.map((chat) => (
              <ChatRow
                key={chat.id}
                chat={chat}
                onPress={() => openChat(chat)}
              />
            ))}
            <Divider />
          </>
        )}
        <SectionLabel label="MESSAGES" />
        {recent.map((chat) => (
          <ChatRow key={chat.id} chat={chat} onPress={() => openChat(chat)} />
        ))}
        <View style={{ height: 90 }} />
      </ScrollView>

      <TouchableOpacity style={s.fab} activeOpacity={0.85}>
        <IconEdit color={C.white} size={19} />
      </TouchableOpacity>
    </View>
  );
}

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

// ─── STATUS TAB ──────────────────────────────────────────────────────────────

function StatusTab() {
  const unseen = STATUSES.filter((st) => !st.seen);
  const seen = STATUSES.filter((st) => st.seen);
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={s.myStatusCard} activeOpacity={0.8}>
        <View style={s.myStatusAvatar}>
          <Text style={s.myStatusInitial}>U</Text>
          <View style={s.addDot}>
            <IconPlus color={C.white} size={11} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.myStatusName}>My Status</Text>
          <Text style={s.myStatusSub}>Tap to add an update</Text>
        </View>
      </TouchableOpacity>

      <SectionLabel label="RECENT UPDATES" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.statusRow}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
      >
        {unseen.map((st, i) => (
          <StatusBubble key={i} status={st} seen={false} />
        ))}
      </ScrollView>

      <Divider />
      <SectionLabel label="VIEWED" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.statusRow}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
      >
        {seen.map((st, i) => (
          <StatusBubble key={i} status={st} seen={true} />
        ))}
      </ScrollView>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StatusBubble({
  status,
  seen,
}: {
  status: (typeof STATUSES)[0];
  seen: boolean;
}) {
  return (
    <TouchableOpacity style={s.statusBubble} activeOpacity={0.8}>
      <View style={[s.statusRing, seen && s.statusRingSeen]}>
        <View style={[s.statusRingInner, { backgroundColor: status.color }]}>
          <Text style={s.statusBubbleText}>{status.initials}</Text>
        </View>
      </View>
      <Text style={s.statusBubbleName} numberOfLines={1}>
        {status.name}
      </Text>
    </TouchableOpacity>
  );
}

// ─── MARKETPLACE TAB ─────────────────────────────────────────────────────────

function MarketplaceTab() {
  const [query, setQuery] = useState("");
  const filtered = MARKET.filter((m) =>
    m.title.toLowerCase().includes(query.toLowerCase()),
  );
  const pairs: (typeof MARKET)[] = [];
  for (let i = 0; i < filtered.length; i += 2)
    pairs.push(filtered.slice(i, i + 2));

  return (
    <View style={{ flex: 1 }}>
      <View style={s.searchBox}>
        <IconSearch />
        <TextInput
          style={s.searchInput}
          placeholder="Search listings…"
          placeholderTextColor={C.faint}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <View style={s.marketHeader}>
        <Text style={s.marketCount}>{filtered.length} listings near you</Text>
        <TouchableOpacity style={s.filterBtn}>
          <Text style={s.filterBtnText}>Filter</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {pairs.map((pair, rowIdx) => (
          <View key={rowIdx} style={s.marketRow}>
            {pair.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={s.marketCard}
                activeOpacity={0.8}
              >
                <View style={[s.marketCardImg, { backgroundColor: item.bg }]}>
                  <Text style={s.marketEmoji}>{item.emoji}</Text>
                </View>
                <View style={s.marketCardBody}>
                  <Text style={s.marketCardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={s.marketCardPrice}>{"₦" + item.price}</Text>
                  <Text style={s.marketCardSeller}>{"by " + item.seller}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {pair.length === 1 && <View style={{ flex: 1 }} />}
          </View>
        ))}
        <View style={{ height: 90 }} />
      </ScrollView>
      <TouchableOpacity style={s.fab} activeOpacity={0.85}>
        <IconPlus color={C.white} size={20} />
      </TouchableOpacity>
    </View>
  );
}

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────

function ProfileTab() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      <View style={s.profileHero}>
        <View>
          <View style={s.profileAvatar}>
            <Text style={s.profileAvatarText}>U</Text>
          </View>
          <TouchableOpacity style={s.profileEditBtn}>
            <IconEdit color={C.white} size={14} />
          </TouchableOpacity>
        </View>
        <Text style={s.profileName}>Umar Aliyu</Text>
        <Text style={s.profileHandle}>@umar.aliyu · CSC 300L</Text>
        <Text style={s.profileBio}>
          {
            "Computer Science · Unimaid\nBuilding cool things, one commit at a time."
          }
        </Text>
      </View>

      <View style={s.statsRow}>
        {[
          ["24", "Chats"],
          ["7", "Listings"],
          ["142", "Contacts"],
        ].map(([n, l], i) => (
          <View key={i} style={[s.statItem, i < 2 && s.statBorderRight]}>
            <Text style={s.statNum}>{n}</Text>
            <Text style={s.statLabel}>{l.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <View style={s.profileMenu}>
        {MENU.map((item, i) => (
          <TouchableOpacity key={i} style={s.menuItem} activeOpacity={0.7}>
            <View style={[s.menuIconBox, { backgroundColor: item.bg }]}>
              <Text style={{ fontSize: 16 }}>{item.icon}</Text>
            </View>
            <Text style={s.menuLabel}>{item.label}</Text>
            <IconChevron />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── NAV ICON ────────────────────────────────────────────────────────────────

function NavIcon({ id, color }: { id: string; color: string }) {
  if (id === "chats") return <IconChat color={color} />;
  if (id === "status") return <IconStatus color={color} />;
  if (id === "marketplace") return <IconMarket color={color} />;
  if (id === "profile") return <IconProfile color={color} />;
  return null;
}

const NAV = [
  { id: "chats", label: "Chats", badge: 3 },
  { id: "status", label: "Status", badge: 0 },
  { id: "marketplace", label: "Market", badge: 0 },
  { id: "profile", label: "Profile", badge: 0 },
];

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function Home() {
  const [activeNav, setActiveNav] = useState("chats");

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgDeep} />

      {/* TOP BAR */}
      <View style={s.topBar}>
        <View>
          <Text style={s.wordmark}>
            {"unimaid "}
            <Text style={s.wordmarkAccent}>resources</Text>
          </Text>
          <Text style={s.wordmarkSub}>University of Maiduguri</Text>
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

      {activeNav === "chats" && (
        <View style={s.filterRow}>
          {["All", "Unread", "Groups"].map((t, i) => (
            <TouchableOpacity
              key={t}
              style={[s.filterPill, i === 0 && s.filterPillActive]}
            >
              <Text
                style={[s.filterPillText, i === 0 && s.filterPillTextActive]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ flex: 1 }}>
        {activeNav === "chats" && <ChatsTab />}
        {activeNav === "status" && <StatusTab />}
        {activeNav === "marketplace" && <MarketplaceTab />}
        {activeNav === "profile" && <ProfileTab />}
      </View>

      {/* BOTTOM NAV */}
      <View style={s.bottomNav}>
        {NAV.map((tab) => {
          const active = activeNav === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={s.navItem}
              onPress={() => setActiveNav(tab.id)}
              activeOpacity={0.7}
            >
              <View style={[s.navIconWrap, active && s.navIconWrapActive]}>
                <NavIcon id={tab.id} color={active ? C.purpleGlow : C.faint} />
              </View>
              <Text style={[s.navLabel, active && s.navLabelActive]}>
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
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
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
    marginTop: 8,
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
    bottom: 24,
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

  myStatusCard: {
    margin: 20,
    padding: 15,
    borderRadius: 18,
    backgroundColor: C.purpleFaint,
    borderWidth: 1,
    borderColor: "rgba(109,40,217,0.3)",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  myStatusAvatar: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: C.purpleMid,
    alignItems: "center",
    justifyContent: "center",
  },
  myStatusInitial: { color: C.white, fontSize: 20, fontWeight: "800" },
  addDot: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.purpleLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.bg,
  },
  myStatusName: { fontSize: 15, fontWeight: "700", color: C.white },
  myStatusSub: { fontSize: 12, color: C.faint, marginTop: 2 },
  statusRow: { paddingVertical: 8 },
  statusBubble: { alignItems: "center", width: 64 },
  statusRing: {
    width: 58,
    height: 58,
    borderRadius: 18,
    padding: 2.5,
    backgroundColor: C.purpleMid,
  },
  statusRingSeen: { backgroundColor: "rgba(255,255,255,0.15)" },
  statusRingInner: {
    flex: 1,
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBubbleText: { color: C.white, fontWeight: "700", fontSize: 14 },
  statusBubbleName: {
    fontSize: 11,
    color: C.whiteMuted,
    marginTop: 5,
    textAlign: "center",
    fontWeight: "500",
  },

  marketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  marketCount: { fontSize: 13, color: C.whiteMuted, fontWeight: "600" },
  filterBtn: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  filterBtnText: { color: C.purpleGlow, fontSize: 12, fontWeight: "700" },
  marketRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 10,
  },
  marketCard: {
    flex: 1,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    overflow: "hidden",
  },
  marketCardImg: { height: 96, alignItems: "center", justifyContent: "center" },
  marketEmoji: { fontSize: 38 },
  marketCardBody: { padding: 10 },
  marketCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.whiteSoft,
    marginBottom: 4,
    lineHeight: 17,
  },
  marketCardPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: C.purpleGlow,
    marginBottom: 2,
  },
  marketCardSeller: { fontSize: 11, color: C.faint, fontStyle: "italic" },

  profileHero: {
    alignItems: "center",
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 7,
  },
  profileAvatar: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: C.purpleMid,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.4)",
  },
  profileAvatarText: { color: C.white, fontSize: 32, fontWeight: "900" },
  profileEditBtn: {
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
  profileName: {
    fontSize: 22,
    fontWeight: "900",
    color: C.white,
    marginTop: 6,
  },
  profileHandle: { fontSize: 13, color: C.purpleGlow, fontStyle: "italic" },
  profileBio: {
    fontSize: 13,
    color: C.whiteMuted,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    overflow: "hidden",
  },
  statItem: { flex: 1, paddingVertical: 14, alignItems: "center" },
  statBorderRight: { borderRightWidth: 1, borderRightColor: C.border },
  statNum: { fontSize: 21, fontWeight: "900", color: C.white },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    color: C.faint,
    marginTop: 2,
  },
  profileMenu: { paddingHorizontal: 20, gap: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 13,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: C.whiteSoft },

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
