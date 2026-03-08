/*
  File: app/Status.tsx
  Purpose: Unimaid Resources — Status Screen
  Routing: Expo Router
*/

import React from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { C } from "./constants/theme";
import { BottomNav, TopBar } from "./Home";

// ─── DATA ────────────────────────────────────────────────────────────────────

const STATUSES = [
  {
    name: "Amaka",
    initials: "AO",
    color: "#be185d",
    seen: false,
    time: "2m ago",
  },
  {
    name: "CSC Dept",
    initials: "CS",
    color: "#0e7490",
    seen: false,
    time: "15m ago",
  },
  {
    name: "Ibrahim",
    initials: "IB",
    color: "#065f46",
    seen: false,
    time: "1h ago",
  },
  {
    name: "Tunde",
    initials: "TB",
    color: "#b45309",
    seen: true,
    time: "3h ago",
  },
  {
    name: "Fatima",
    initials: "FU",
    color: "#5b21b6",
    seen: true,
    time: "5h ago",
  },
];

// ─── SVG ─────────────────────────────────────────────────────────────────────

function IconPlus({
  color = C.white,
  size = 11,
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
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Line
        x1="5"
        y1="12"
        x2="19"
        y2="12"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconCamera({
  color = C.whiteMuted,
  size = 18,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function IconText({
  color = C.whiteMuted,
  size = 18,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M4 12h16M4 18h7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── STATUS ROW (full-width horizontal card style) ────────────────────────────

function StatusRow({ status }: { status: (typeof STATUSES)[0] }) {
  return (
    <TouchableOpacity style={s.statusRow} activeOpacity={0.75}>
      {/* Ring */}
      <View style={[s.ring, status.seen ? s.ringSeen : s.ringUnseen]}>
        <View style={[s.ringInner, { backgroundColor: status.color }]}>
          <Text style={s.ringText}>{status.initials}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={s.statusName}>{status.name}</Text>
        <Text style={s.statusTime}>{status.time}</Text>
      </View>

      {/* Unseen dot */}
      {!status.seen && <View style={s.unseenDot} />}
    </TouchableOpacity>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function Status() {
  const unseen = STATUSES.filter((st) => !st.seen);
  const seen = STATUSES.filter((st) => st.seen);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgDeep} />
      <TopBar />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* My Status */}
        <TouchableOpacity style={s.myCard} activeOpacity={0.8}>
          <View style={s.myAvatarWrap}>
            <View style={s.myAvatar}>
              <Text style={s.myAvatarText}>U</Text>
            </View>
            <View style={s.addBtn}>
              <IconPlus />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.myName}>My Status</Text>
            <Text style={s.mySub}>Tap to add a photo or text update</Text>
          </View>
        </TouchableOpacity>

        {/* Quick action buttons */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.actionBtn}>
            <View style={s.actionIcon}>
              <IconCamera />
            </View>
            <Text style={s.actionLabel}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <View style={s.actionIcon}>
              <IconText />
            </View>
            <Text style={s.actionLabel}>Text</Text>
          </TouchableOpacity>
        </View>

        <View style={s.divider} />

        {/* Recent */}
        {unseen.length > 0 && (
          <>
            <Text style={s.sectionLabel}>RECENT UPDATES</Text>
            {unseen.map((st, i) => (
              <StatusRow key={i} status={st} />
            ))}
          </>
        )}

        {/* Viewed */}
        {seen.length > 0 && (
          <>
            <View style={s.divider} />
            <Text style={s.sectionLabel}>VIEWED</Text>
            {seen.map((st, i) => (
              <StatusRow key={i} status={st} />
            ))}
          </>
        )}
      </ScrollView>

      <BottomNav active="status" />
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  myCard: {
    margin: 20,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(109,40,217,0.15)",
    borderWidth: 1,
    borderColor: "rgba(109,40,217,0.3)",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  myAvatarWrap: { position: "relative" },
  myAvatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: C.purpleMid,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.4)",
  },
  myAvatarText: { color: C.white, fontSize: 22, fontWeight: "800" },
  addBtn: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.purpleLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.bg,
  },
  myName: { fontSize: 15, fontWeight: "700", color: C.white },
  mySub: { fontSize: 12, color: C.faint, marginTop: 2 },

  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(109,40,217,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 14, fontWeight: "600", color: C.whiteSoft },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 20,
    marginVertical: 10,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: C.faint,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  ring: {
    width: 56,
    height: 56,
    borderRadius: 17,
    padding: 2.5,
  },
  ringUnseen: { backgroundColor: C.purpleMid },
  ringSeen: { backgroundColor: "rgba(255,255,255,0.18)" },
  ringInner: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  ringText: { color: C.white, fontWeight: "700", fontSize: 14 },
  statusName: { fontSize: 15, fontWeight: "700", color: C.whiteSoft },
  statusTime: { fontSize: 12, color: C.faint, marginTop: 2 },
  unseenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.purpleGlow,
  },

  // re-used from Home
  whiteSoft: { color: C.whiteSoft },
  purpleGlow: { color: C.purpleGlow },
  purpleMid: { color: C.purpleMid },
  purpleLight: { color: C.purpleLight },
});
