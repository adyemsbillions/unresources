/*
  File: app/Marketplace.tsx
  Purpose: Unimaid Resources — Marketplace Screen
  Routing: Expo Router
*/

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
import { C } from "./constants/theme";
import { BottomNav, TopBar } from "./Home";

// ─── DATA ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "All",
  "Books",
  "Electronics",
  "Furniture",
  "Clothing",
  "Other",
];

const LISTINGS = [
  {
    id: 1,
    title: "Texas Instruments TI-84",
    price: "18,500",
    seller: "Chidi O.",
    emoji: "🧮",
    bg: "#1e1b4b",
    cat: "Electronics",
    time: "2h ago",
  },
  {
    id: 2,
    title: "200L Chemistry Notes",
    price: "2,000",
    seller: "Amaka U.",
    emoji: "📚",
    bg: "#1a1a2e",
    cat: "Books",
    time: "4h ago",
  },
  {
    id: 3,
    title: "Mini Fridge (barely used)",
    price: "35,000",
    seller: "Final Year",
    emoji: "🧊",
    bg: "#0f172a",
    cat: "Furniture",
    time: "1d ago",
  },
  {
    id: 4,
    title: "Laptop Charger 65W",
    price: "7,800",
    seller: "Tunde B.",
    emoji: "🔌",
    bg: "#1c1917",
    cat: "Electronics",
    time: "1d ago",
  },
  {
    id: 5,
    title: "Biochem Textbook 3rd Ed",
    price: "5,500",
    seller: "Sara M.",
    emoji: "🔬",
    bg: "#142010",
    cat: "Books",
    time: "2d ago",
  },
  {
    id: 6,
    title: "Engineering Drawing Set",
    price: "4,200",
    seller: "Emeka K.",
    emoji: "📐",
    bg: "#1a100a",
    cat: "Other",
    time: "2d ago",
  },
  {
    id: 7,
    title: "Study Chair",
    price: "12,000",
    seller: "Hassan Y.",
    emoji: "🪑",
    bg: "#10181a",
    cat: "Furniture",
    time: "3d ago",
  },
  {
    id: 8,
    title: "HP Laptop 8GB RAM",
    price: "110,000",
    seller: "Bilal A.",
    emoji: "💻",
    bg: "#0f1020",
    cat: "Electronics",
    time: "3d ago",
  },
];

// ─── SVG ─────────────────────────────────────────────────────────────────────

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

function IconFilter({
  color = C.purpleGlow,
  size = 15,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line
        x1="4"
        y1="6"
        x2="20"
        y2="6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="7"
        y1="12"
        x2="17"
        y2="12"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Line
        x1="10"
        y1="18"
        x2="14"
        y2="18"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconHeart({
  color = C.faint,
  size = 15,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── MARKET CARD ─────────────────────────────────────────────────────────────

function ListingCard({ item }: { item: (typeof LISTINGS)[0] }) {
  return (
    <TouchableOpacity style={s.card} activeOpacity={0.82}>
      {/* Image area */}
      <View style={[s.cardImg, { backgroundColor: item.bg }]}>
        <Text style={s.cardEmoji}>{item.emoji}</Text>
        <TouchableOpacity style={s.heartBtn}>
          <IconHeart />
        </TouchableOpacity>
      </View>
      {/* Body */}
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={s.cardPrice}>{"₦" + item.price}</Text>
        <View style={s.cardFooter}>
          <Text style={s.cardSeller}>{"by " + item.seller}</Text>
          <Text style={s.cardTime}>{item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function Marketplace() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = LISTINGS.filter((item) => {
    const matchQuery = item.title.toLowerCase().includes(query.toLowerCase());
    const matchCat = activeCategory === "All" || item.cat === activeCategory;
    return matchQuery && matchCat;
  });

  // Split into pairs for 2-col grid
  const pairs: (typeof LISTINGS)[] = [];
  for (let i = 0; i < filtered.length; i += 2)
    pairs.push(filtered.slice(i, i + 2));

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgDeep} />
      <TopBar />

      {/* Search + Filter */}
      <View style={s.searchRow}>
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
        <TouchableOpacity style={s.filterIconBtn}>
          <IconFilter />
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.categoryScroll}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.catPill, activeCategory === cat && s.catPillActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text
              style={[
                s.catPillText,
                activeCategory === cat && s.catPillTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Count */}
      <View style={s.countRow}>
        <Text style={s.countText}>{filtered.length} listings</Text>
        <Text style={s.sortText}>Newest first</Text>
      </View>

      {/* Grid */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {pairs.map((pair, i) => (
          <View key={i} style={s.gridRow}>
            {pair.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
            {pair.length === 1 && <View style={{ flex: 1 }} />}
          </View>
        ))}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Post listing FAB */}
      <TouchableOpacity style={s.fab} activeOpacity={0.85}>
        <IconPlus />
      </TouchableOpacity>

      <BottomNav active="marketplace" />
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, color: C.white, fontSize: 14 },
  filterIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(109,40,217,0.2)",
    borderWidth: 1,
    borderColor: C.purpleMid,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryScroll: { maxHeight: 46, marginBottom: 4 },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  catPillActive: {
    backgroundColor: "rgba(109,40,217,0.22)",
    borderColor: C.purpleMid,
  },
  catPillText: { color: C.faint, fontSize: 13, fontWeight: "600" },
  catPillTextActive: { color: C.purpleGlow, fontWeight: "700" },

  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  countText: { fontSize: 12, color: C.whiteMuted, fontWeight: "600" },
  sortText: { fontSize: 12, color: C.purpleGlow, fontWeight: "600" },

  gridRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 10,
  },

  card: {
    flex: 1,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    overflow: "hidden",
  },
  cardImg: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cardEmoji: { fontSize: 40 },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { padding: 10 },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.whiteSoft,
    marginBottom: 4,
    lineHeight: 17,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: C.purpleGlow,
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardSeller: { fontSize: 11, color: C.faint, fontStyle: "italic" },
  cardTime: { fontSize: 10, color: C.faint },

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
});
