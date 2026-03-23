/*
  File: app/Marketplace.tsx
  Purpose: Unimaid Resources — Marketplace Screen (real DB + better UI)
*/

import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { BottomNav } from "./Home";

const API_BASE = "https://unresources.cravii.ng/api";
const AGENT_PHONE = "09139293270";
const AGENT_PHONE_INTL = "2349139293270";

// ─── Responsive helpers ────────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const isSmall = SCREEN_W < 360;
const isMedium = SCREEN_W >= 360 && SCREEN_W < 480;
const isLarge = SCREEN_W >= 480;

/** Scale a base size linearly with screen width (clamped). */
function rs(base: number, min?: number, max?: number): number {
  const scaled = (SCREEN_W / 390) * base;
  if (min !== undefined && scaled < min) return min;
  if (max !== undefined && scaled > max) return max;
  return Math.round(scaled);
}

// ──────────────────────────────────────────────────────────────────────────────

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

const CATEGORIES = [
  "All",
  "Books",
  "Electronics",
  "Phones & Accessories",
  "Laptops & Computers",
  "Furniture",
  "Hostel Items",
  "Clothing",
  "Shoes",
  "Bags",
  "Beauty & Skincare",
  "Watches & Jewelry",
  "Food & Snacks",
  "Kitchen Items",
  "Sports & Fitness",
  "School Materials",
  "Project Materials",
  "Games",
  "Services",
  "Other",
];

const ADD_CATEGORIES = CATEGORIES.filter((c) => c !== "All");

type Listing = {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  price: string;
  category: string;
  condition_label?: string;
  image_url?: string;
  location?: string;
  seller_name?: string;
  seller_phone?: string;
  whatsapp?: string;
  created_at: string;
};

function formatPrice(value: string | number) {
  const num = Number(value || 0);
  return num.toLocaleString("en-NG");
}

function timeAgo(dateString: string) {
  const now = new Date().getTime();
  const then = new Date(dateString).getTime();
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
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

function IconPlus({ color, size = 20 }: { color: string; size?: number }) {
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

function IconFilter({ color, size = 15 }: { color: string; size?: number }) {
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

function IconHeart({ color, size = 15 }: { color: string; size?: number }) {
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
        <IconPalette
          color={open ? T.purpleGlow : T.whiteMuted}
          size={rs(19, 16, 22)}
        />
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
              <Text style={{ fontSize: rs(15, 13, 17), marginRight: 8 }}>
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

function TopBar({
  theme,
  onThemeChange,
  T,
}: {
  theme: ThemeMode;
  onThemeChange: (t: ThemeMode) => void;
  T: Theme;
}) {
  return (
    <View style={[s.topBar, { borderBottomColor: T.border }]}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text
          style={[s.wordmark, { color: T.white }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {"UNIMAID "}
          <Text style={{ color: T.purpleGlow }}>RESOURCES MART</Text>
        </Text>
        <Text style={[s.wordmarkSub, { color: T.faint }]}>
          Marketplace for students
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <ThemeSwitcher current={theme} onChange={onThemeChange} T={T} />
        <TouchableOpacity
          style={[
            s.iconBtn,
            { backgroundColor: T.card, borderColor: T.border },
          ]}
        >
          <IconBell color={T.whiteMuted} size={rs(19, 16, 22)} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ListingCard({
  item,
  T,
  onPress,
}: {
  item: Listing;
  T: Theme;
  onPress: () => void;
}) {
  // Card image height scales with available column width
  const cardImgHeight = rs(130, 100, 160);

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: T.card, borderColor: T.border }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View
        style={[
          s.cardImg,
          { backgroundColor: T.bgDeep, height: cardImgHeight },
        ]}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={s.cardImageReal} />
        ) : (
          <Text style={[s.cardEmoji, { fontSize: rs(36, 28, 44) }]}>🛍️</Text>
        )}

        <TouchableOpacity style={s.heartBtn}>
          <IconHeart color={T.faint} size={rs(15, 12, 18)} />
        </TouchableOpacity>

        <View style={[s.catBadge, { backgroundColor: T.purpleFaint }]}>
          <Text
            style={[s.catBadgeText, { color: T.purpleGlow }]}
            numberOfLines={1}
          >
            {item.category}
          </Text>
        </View>
      </View>

      <View style={[s.cardBody, { padding: rs(10, 8, 14) }]}>
        <Text
          style={[
            s.cardTitle,
            { color: T.whiteSoft, fontSize: rs(13, 11, 15) },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        <Text
          style={[
            s.cardPrice,
            { color: T.purpleGlow, fontSize: rs(15, 13, 17) },
          ]}
        >
          ₦{formatPrice(item.price)}
        </Text>

        {!!item.condition_label && (
          <Text
            style={[
              s.cardMeta,
              { color: T.whiteMuted, fontSize: rs(11, 10, 13) },
            ]}
          >
            {item.condition_label}
          </Text>
        )}

        <View style={s.cardFooter}>
          <Text
            style={[s.cardSeller, { color: T.faint, fontSize: rs(11, 10, 13) }]}
            numberOfLines={1}
          >
            {item.seller_name || "Unknown seller"}
          </Text>
          <Text
            style={[s.cardTime, { color: T.faint, fontSize: rs(10, 9, 12) }]}
          >
            {timeAgo(item.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Marketplace() {
  const insets = useSafeAreaInsets();

  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const T: Theme = THEMES[themeMode];

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [addVisible, setAddVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Listing | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Other");
  const [conditionLabel, setConditionLabel] = useState("");
  const [location, setLocation] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [agentCode, setAgentCode] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync("theme")
      .then((saved) => {
        if (saved && THEMES[saved as ThemeMode])
          setThemeMode(saved as ThemeMode);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const stored =
          (await SecureStore.getItemAsync("user")) ||
          (await SecureStore.getItemAsync("userData")) ||
          (await SecureStore.getItemAsync("currentUser"));
        if (stored) setCurrentUser(JSON.parse(stored));
      } catch (err) {
        console.log("User load error:", err);
      }
      await loadItems();
    };
    init();
  }, []);

  const handleThemeChange = (t: ThemeMode) => {
    setThemeMode(t);
    SecureStore.setItemAsync("theme", t).catch(() => {});
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      const url = `${API_BASE}/get_marketplace_items.php?q=${encodeURIComponent(query)}&category=${encodeURIComponent(activeCategory)}`;
      const res = await fetch(url);
      const text = await res.text();
      const data = JSON.parse(text);
      setItems(data.status === "success" ? data.items || [] : []);
    } catch (err) {
      console.log("Marketplace load error:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, activeCategory]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setCategory("Other");
    setConditionLabel("");
    setLocation("");
    setSellerPhone("");
    setWhatsapp("");
    setAgentCode("");
    setImageUri("");
    setUploadedImageUrl("");
    setUploadingImage(false);
  };

  const openAgentWhatsapp = async () => {
    const username =
      currentUser?.username ||
      currentUser?.name ||
      currentUser?.fullname ||
      "user";
    const message =
      `Hi, I am ${username}. ` +
      `I want to become a seller to list my items on Unimaid Resources. ` +
      `I know I am going to pay 1000 for two weeks or 1800 for 1 month.`;
    const whatsappUrl = `https://wa.me/${AGENT_PHONE_INTL}?text=${encodeURIComponent(message)}`;
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) await Linking.openURL(whatsappUrl);
      else Alert.alert("WhatsApp not available", `Contact: ${AGENT_PHONE}`);
    } catch {
      Alert.alert("Error", `Contact on WhatsApp: ${AGENT_PHONE}`);
    }
  };

  const openBuyerWhatsapp = async (phone?: string, title?: string) => {
    if (!phone) {
      Alert.alert("Unavailable", "WhatsApp number not available");
      return;
    }
    const clean = phone.replace(/\D/g, "");
    const intl = clean.startsWith("0") ? `234${clean.slice(1)}` : clean;
    const message = `Hello, I want to buy this item: ${title || "Marketplace item"}`;
    const url = `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("Unavailable", "Could not open WhatsApp");
    } catch {
      Alert.alert("Error", "Could not open WhatsApp");
    }
  };

  const callSeller = async (phone?: string) => {
    if (!phone) {
      Alert.alert("Unavailable", "Phone number not available");
      return;
    }
    const url = `tel:${phone.replace(/\s+/g, "")}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else
        Alert.alert("Unavailable", "Calling is not supported on this device");
    } catch {
      Alert.alert("Error", "Could not open dialer");
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Allow gallery access to pick image.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setImageUri(asset.uri);
      setUploadingImage(true);

      if (!asset.base64) {
        Alert.alert("Error", "Could not read image data");
        setUploadingImage(false);
        return;
      }

      const originalName =
        asset.fileName ||
        asset.uri.split("/").pop() ||
        `market_${Date.now()}.jpg`;
      const cleanName = originalName.split("?")[0];
      const match = /\.(jpg|jpeg|png|gif|webp)$/i.exec(cleanName);
      const ext = match ? match[1].toLowerCase() : "jpg";
      let mimeType = "image/jpeg";
      if (ext === "png") mimeType = "image/png";
      if (ext === "gif") mimeType = "image/gif";
      if (ext === "webp") mimeType = "image/webp";

      const res = await fetch(
        `${API_BASE}/upload_marketplace_image_base64.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: asset.base64,
            mimeType,
            extension: ext,
          }),
        },
      );
      const text = await res.text();
      const data = JSON.parse(text);

      if (data.success && data.imageUrl) {
        setUploadedImageUrl(data.imageUrl);
        Alert.alert("Success", "Image uploaded successfully");
      } else {
        setUploadedImageUrl("");
        Alert.alert("Upload failed", data.message || "Could not upload image");
      }
    } catch (err: any) {
      setUploadedImageUrl("");
      Alert.alert("Error", err?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const saveItem = async () => {
    if (!currentUser?.id) {
      Alert.alert("Error", "No logged-in user found");
      return;
    }
    if (!title.trim() || !price.trim()) {
      Alert.alert("Error", "Title and price are required");
      return;
    }
    if (!agentCode.trim()) {
      Alert.alert("Error", "Agent code is required");
      return;
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert("Error", "Enter a valid price");
      return;
    }
    if (uploadingImage) {
      Alert.alert("Please wait", "Image is still uploading");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/add_marketplace_item.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          agent_code: agentCode.trim(),
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          category: category.trim() || "Other",
          condition_label: conditionLabel.trim(),
          image_url: uploadedImageUrl || "",
          location: location.trim(),
          seller_name:
            currentUser.name ||
            currentUser.fullname ||
            currentUser.username ||
            "",
          seller_phone: sellerPhone.trim(),
          whatsapp: whatsapp.trim(),
        }),
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (data.status === "success") {
        setAddVisible(false);
        resetForm();
        await loadItems();
        Alert.alert("Success", "Listing added successfully");
      } else {
        Alert.alert("Error", data.message || "Failed to add listing");
      }
    } catch (err) {
      Alert.alert("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => items, [items]);

  const pairs: Listing[][] = [];
  for (let i = 0; i < filtered.length; i += 2) {
    pairs.push(filtered.slice(i, i + 2));
  }

  // ── shared input style ──────────────────────────────────────────────────────
  const inputStyle = (T: Theme) => ({
    backgroundColor: T.bg,
    borderColor: T.border,
    color: T.white,
    height: rs(48, 42, 54),
    fontSize: rs(14, 12, 16),
  });

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />

      <View style={s.headerWrap}>
        <TopBar theme={themeMode} onThemeChange={handleThemeChange} T={T} />
      </View>

      {/* Search row */}
      <View style={s.searchRow}>
        <View
          style={[
            s.searchBox,
            { backgroundColor: T.card, borderColor: T.border },
          ]}
        >
          <IconSearch color={T.faint} size={rs(17, 15, 20)} />
          <TextInput
            style={[
              s.searchInput,
              { color: T.white, fontSize: rs(14, 12, 16) },
            ]}
            placeholder="Search listings..."
            placeholderTextColor={T.faint}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <TouchableOpacity
          style={[
            s.filterIconBtn,
            { backgroundColor: T.purpleFaint, borderColor: T.purpleMid },
          ]}
        >
          <IconFilter color={T.purpleGlow} size={rs(15, 13, 18)} />
        </TouchableOpacity>
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.categoryScroll}
        contentContainerStyle={{ paddingHorizontal: rs(20, 12, 24), gap: 8 }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                s.catPill,
                {
                  backgroundColor: isActive ? T.purpleFaint : T.card,
                  borderColor: isActive ? T.purpleMid : T.border,
                },
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  s.catPillText,
                  {
                    color: isActive ? T.purpleGlow : T.faint,
                    fontWeight: isActive ? "700" : "600",
                    fontSize: rs(13, 11, 15),
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Count row */}
      <View style={s.countRow}>
        <Text
          style={[
            s.countText,
            { color: T.whiteMuted, fontSize: rs(12, 11, 14) },
          ]}
        >
          {filtered.length} listings
        </Text>
        <Text
          style={[
            s.sortText,
            { color: T.purpleGlow, fontSize: rs(12, 11, 14) },
          ]}
        >
          Newest first
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={T.purpleGlow}
          style={{ flex: 1 }}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: 80 + insets.bottom, // enough space for bottom nav + safe area
          }}
        >
          {pairs.length === 0 ? (
            <Text
              style={[
                s.emptyText,
                { color: T.faint, fontSize: rs(14, 13, 16) },
              ]}
            >
              No marketplace items yet
            </Text>
          ) : (
            pairs.map((pair, i) => (
              <View
                key={i}
                style={[
                  s.gridRow,
                  { paddingHorizontal: rs(14, 10, 18), gap: rs(10, 8, 14) },
                ]}
              >
                {pair.map((item) => (
                  <ListingCard
                    key={item.id}
                    item={item}
                    T={T}
                    onPress={() => {
                      setSelectedItem(item);
                      setDetailsVisible(true);
                    }}
                  />
                ))}
                {pair.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[
          s.fab,
          {
            backgroundColor: T.purpleMid,
            shadowColor: T.purpleMid,
            bottom: rs(80, 72, 92),
            right: rs(20, 14, 26),
          },
        ]}
        activeOpacity={0.85}
        onPress={() => {
          resetForm();
          setAddVisible(true);
        }}
      >
        <IconPlus color="#fff" size={rs(20, 18, 24)} />
      </TouchableOpacity>

      {/* ── Add Listing Modal ─────────────────────────────────────────────── */}
      <Modal
        transparent
        visible={addVisible}
        animationType="fade"
        onRequestClose={() => setAddVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAddVisible(false)}>
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  s.modalCard,
                  {
                    backgroundColor: T.card,
                    borderColor: T.border,
                    // On wider screens, cap and centre the modal
                    maxWidth: Math.min(SCREEN_W - 36, 520),
                    alignSelf: "center",
                    width: "100%",
                  },
                ]}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text
                    style={[
                      s.modalTitle,
                      { color: T.white, fontSize: rs(20, 17, 24) },
                    ]}
                  >
                    Add Listing
                  </Text>

                  {/* Image picker */}
                  <TouchableOpacity
                    style={[
                      s.imagePicker,
                      {
                        backgroundColor: T.bgDeep,
                        borderColor: T.border,
                        height: rs(180, 140, 220),
                      },
                    ]}
                    onPress={pickImage}
                    disabled={uploadingImage}
                  >
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={s.previewImage}
                      />
                    ) : (
                      <Text
                        style={[
                          s.imagePickerText,
                          { color: T.faint, fontSize: rs(14, 12, 16) },
                        ]}
                      >
                        Tap to upload product image
                      </Text>
                    )}
                  </TouchableOpacity>

                  {uploadingImage && (
                    <View style={{ marginBottom: 12, alignItems: "center" }}>
                      <ActivityIndicator color={T.purpleGlow} />
                      <Text
                        style={{
                          color: T.whiteMuted,
                          marginTop: 8,
                          fontSize: rs(13, 11, 15),
                        }}
                      >
                        Uploading image...
                      </Text>
                    </View>
                  )}

                  <TextInput
                    style={[s.input, inputStyle(T)]}
                    placeholder="Agent Code *"
                    placeholderTextColor={T.faint}
                    value={agentCode}
                    onChangeText={setAgentCode}
                    autoCapitalize="characters"
                  />

                  <TouchableOpacity
                    style={[
                      s.agentHelpBtn,
                      {
                        backgroundColor: T.purpleFaint,
                        borderColor: T.purpleMid,
                      },
                    ]}
                    onPress={openAgentWhatsapp}
                  >
                    <Text
                      style={[
                        s.agentHelpBtnText,
                        { color: T.purpleGlow, fontSize: rs(13, 11, 15) },
                      ]}
                    >
                      Get Agent Code • ₦1000 / 2 Weeks • ₦1800 / 1 Month
                    </Text>
                  </TouchableOpacity>

                  <TextInput
                    style={[s.input, inputStyle(T)]}
                    placeholder="Title"
                    placeholderTextColor={T.faint}
                    value={title}
                    onChangeText={setTitle}
                  />
                  <TextInput
                    style={[
                      s.input,
                      s.textarea,
                      inputStyle(T),
                      { height: rs(100, 80, 120) },
                    ]}
                    placeholder="Description"
                    placeholderTextColor={T.faint}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />
                  <TextInput
                    style={[s.input, inputStyle(T)]}
                    placeholder="Price"
                    placeholderTextColor={T.faint}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />

                  <View
                    style={[
                      s.pickerWrap,
                      { backgroundColor: T.bg, borderColor: T.border },
                    ]}
                  >
                    <Picker
                      selectedValue={category}
                      onValueChange={(value) => setCategory(value)}
                      style={[
                        s.picker,
                        { color: T.white, height: rs(54, 46, 60) },
                      ]}
                      dropdownIconColor={T.whiteMuted}
                    >
                      {ADD_CATEGORIES.map((item) => (
                        <Picker.Item
                          key={item}
                          label={item}
                          value={item}
                          color={themeMode === "light" ? "#1A1B2E" : "#FFFFFF"}
                        />
                      ))}
                    </Picker>
                  </View>

                  <TextInput
                    style={[s.input, inputStyle(T)]}
                    placeholder="Condition"
                    placeholderTextColor={T.faint}
                    value={conditionLabel}
                    onChangeText={setConditionLabel}
                  />
                  <TextInput
                    style={[s.input, inputStyle(T)]}
                    placeholder="Location"
                    placeholderTextColor={T.faint}
                    value={location}
                    onChangeText={setLocation}
                  />
                  <TextInput
                    style={[s.input, inputStyle(T)]}
                    placeholder="Phone"
                    placeholderTextColor={T.faint}
                    value={sellerPhone}
                    onChangeText={setSellerPhone}
                  />
                  <TextInput
                    style={[s.input, inputStyle(T)]}
                    placeholder="WhatsApp"
                    placeholderTextColor={T.faint}
                    value={whatsapp}
                    onChangeText={setWhatsapp}
                  />

                  <View style={s.modalBtns}>
                    <TouchableOpacity
                      style={[
                        s.btnCancel,
                        {
                          borderColor: T.border,
                          paddingVertical: rs(12, 10, 14),
                        },
                      ]}
                      onPress={() => setAddVisible(false)}
                      disabled={saving || uploadingImage}
                    >
                      <Text
                        style={{ color: T.white, fontSize: rs(14, 13, 16) }}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        s.btnSave,
                        {
                          backgroundColor: T.purpleMid,
                          paddingVertical: rs(12, 10, 14),
                        },
                      ]}
                      onPress={saveItem}
                      disabled={saving || uploadingImage}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "800",
                          fontSize: rs(14, 13, 16),
                        }}
                      >
                        {uploadingImage
                          ? "Uploading image..."
                          : saving
                            ? "Saving..."
                            : "Save"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Details Modal ─────────────────────────────────────────────────── */}
      <Modal
        transparent
        visible={detailsVisible}
        animationType="fade"
        onRequestClose={() => setDetailsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDetailsVisible(false)}>
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  s.modalCard,
                  {
                    backgroundColor: T.card,
                    borderColor: T.border,
                    maxWidth: Math.min(SCREEN_W - 36, 520),
                    alignSelf: "center",
                    width: "100%",
                  },
                ]}
              >
                {selectedItem && (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {selectedItem.image_url ? (
                      <Image
                        source={{ uri: selectedItem.image_url }}
                        style={[s.detailsImage, { height: rs(220, 160, 280) }]}
                      />
                    ) : null}

                    <Text
                      style={[
                        s.detailsTitle,
                        { color: T.white, fontSize: rs(22, 18, 26) },
                      ]}
                    >
                      {selectedItem.title}
                    </Text>

                    <Text
                      style={[
                        s.detailsPrice,
                        { color: T.purpleGlow, fontSize: rs(18, 15, 22) },
                      ]}
                    >
                      ₦{formatPrice(selectedItem.price)}
                    </Text>

                    {!!selectedItem.description && (
                      <Text
                        style={[
                          s.detailsText,
                          { color: T.whiteMuted, fontSize: rs(14, 12, 16) },
                        ]}
                      >
                        {selectedItem.description}
                      </Text>
                    )}

                    {[
                      {
                        label: "Seller",
                        value: selectedItem.seller_name || "Unknown",
                      },
                      { label: "Location", value: selectedItem.location },
                      {
                        label: "Condition",
                        value: selectedItem.condition_label,
                      },
                      { label: "Phone", value: selectedItem.seller_phone },
                      { label: "WhatsApp", value: selectedItem.whatsapp },
                    ].map(
                      ({ label, value }) =>
                        !!value && (
                          <Text
                            key={label}
                            style={[
                              s.detailsMeta,
                              { color: T.faint, fontSize: rs(13, 12, 15) },
                            ]}
                          >
                            {label}: {value}
                          </Text>
                        ),
                    )}

                    <View style={[s.detailsActionRow, { gap: rs(8, 6, 12) }]}>
                      <TouchableOpacity
                        style={[
                          s.detailsActionBtn,
                          {
                            backgroundColor: T.purpleMid,
                            minHeight: rs(46, 40, 52),
                          },
                        ]}
                        onPress={() =>
                          openBuyerWhatsapp(
                            selectedItem.whatsapp || selectedItem.seller_phone,
                            selectedItem.title,
                          )
                        }
                      >
                        <Text
                          style={[
                            s.detailsActionText,
                            { fontSize: rs(13, 12, 15) },
                          ]}
                        >
                          Buy Now
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          s.detailsActionBtn,
                          {
                            backgroundColor: T.card,
                            borderColor: T.border,
                            borderWidth: 1,
                            minHeight: rs(46, 40, 52),
                          },
                        ]}
                        onPress={() => callSeller(selectedItem.seller_phone)}
                      >
                        <Text
                          style={[
                            s.detailsActionText,
                            { color: T.white, fontSize: rs(13, 12, 15) },
                          ]}
                        >
                          Call
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          s.detailsActionBtnSmall,
                          {
                            backgroundColor: T.card,
                            borderColor: T.border,
                            borderWidth: 1,
                            minHeight: rs(46, 40, 52),
                          },
                        ]}
                        onPress={() => setDetailsVisible(false)}
                      >
                        <Text
                          style={[
                            s.detailsActionText,
                            { color: T.white, fontSize: rs(13, 12, 15) },
                          ]}
                        >
                          Close
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Bottom Navigation with safe area padding */}
      <View
        style={{
          backgroundColor: T.navBg || T.card,
          paddingBottom: insets.bottom,
        }}
      >
        <BottomNav active="marketplace" T={T} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 24 : 0,
  },

  headerWrap: { paddingTop: 12 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: rs(20, 14, 28),
    paddingVertical: rs(10, 8, 14),
    borderBottomWidth: 1,
  },
  wordmark: { fontSize: rs(21, 16, 24), fontWeight: "900", letterSpacing: 0.6 },
  wordmarkSub: { fontSize: rs(11, 10, 13), marginTop: 2, letterSpacing: 0.4 },

  iconBtn: {
    width: rs(40, 34, 46),
    height: rs(40, 34, 46),
    borderRadius: rs(13, 10, 15),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  themeDropdown: {
    position: "absolute",
    top: rs(48, 42, 54),
    right: 0,
    width: rs(150, 130, 170),
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
    paddingHorizontal: rs(14, 10, 18),
    paddingVertical: rs(11, 9, 13),
  },
  themeLabel: { fontSize: rs(14, 12, 16), flex: 1 },
  themeDot: { width: 6, height: 6, borderRadius: 3 },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(10, 8, 14),
    paddingHorizontal: rs(20, 14, 26),
    paddingVertical: rs(10, 8, 14),
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: rs(10, 8, 12),
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: rs(14, 10, 18),
    height: rs(44, 38, 50),
  },
  searchInput: { flex: 1 },
  filterIconBtn: {
    width: rs(44, 38, 50),
    height: rs(44, 38, 50),
    borderRadius: rs(13, 10, 15),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryScroll: { maxHeight: rs(46, 40, 52), marginBottom: 4 },
  catPill: {
    paddingHorizontal: rs(14, 10, 18),
    paddingVertical: rs(7, 5, 10),
    borderRadius: 20,
    borderWidth: 1,
  },
  catPillText: {},

  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: rs(20, 14, 26),
    paddingVertical: rs(8, 6, 10),
  },
  countText: { fontWeight: "600" },
  sortText: { fontWeight: "600" },

  gridRow: { flexDirection: "row", marginBottom: rs(10, 8, 14) },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: rs(18, 14, 22),
    overflow: "hidden",
    // Prevent cards from being too narrow on very small phones
    minWidth: 0,
  },
  cardImg: { alignItems: "center", justifyContent: "center" },
  cardImageReal: { width: "100%", height: "100%", resizeMode: "cover" },
  cardEmoji: {},
  heartBtn: {
    position: "absolute",
    top: rs(8, 6, 10),
    right: rs(8, 6, 10),
    width: rs(28, 24, 34),
    height: rs(28, 24, 34),
    borderRadius: rs(9, 7, 11),
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  catBadge: {
    position: "absolute",
    left: rs(8, 6, 10),
    bottom: rs(8, 6, 10),
    paddingHorizontal: rs(8, 6, 10),
    paddingVertical: rs(4, 3, 5),
    borderRadius: 10,
    maxWidth: "80%",
  },
  catBadgeText: { fontSize: rs(10, 9, 12), fontWeight: "700" },
  cardBody: {},
  cardTitle: { fontWeight: "700", marginBottom: 4, lineHeight: rs(17, 14, 20) },
  cardPrice: { fontWeight: "800", marginBottom: 4 },
  cardMeta: { marginBottom: 4 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardSeller: { fontStyle: "italic", flex: 1, marginRight: 6 },
  cardTime: {},

  emptyText: { textAlign: "center", marginTop: 40 },

  fab: {
    position: "absolute",
    width: rs(52, 46, 60),
    height: rs(52, 46, 60),
    borderRadius: rs(16, 12, 20),
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    paddingHorizontal: rs(18, 12, 24),
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: rs(20, 16, 24),
    padding: rs(16, 12, 22),
    maxHeight: "88%",
  },
  modalTitle: { fontWeight: "900", marginBottom: 12 },
  imagePicker: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 12,
  },
  imagePickerText: {},
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: rs(14, 10, 18),
    marginBottom: 10,
  },
  textarea: {
    textAlignVertical: "top",
    paddingTop: 14,
  },
  pickerWrap: {
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  picker: {},
  agentHelpBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: rs(12, 10, 14),
    paddingHorizontal: rs(14, 10, 18),
    alignItems: "center",
    marginBottom: 12,
  },
  agentHelpBtnText: { fontWeight: "700", textAlign: "center" },
  modalBtns: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  btnCancel: {
    borderWidth: 1,
    paddingHorizontal: rs(16, 12, 20),
    borderRadius: 12,
  },
  btnSave: {
    paddingHorizontal: rs(16, 12, 20),
    borderRadius: 12,
    alignItems: "center",
  },

  detailsImage: {
    width: "100%",
    borderRadius: 16,
    resizeMode: "cover",
    marginBottom: 12,
  },
  detailsTitle: { fontWeight: "900", marginBottom: 6 },
  detailsPrice: { fontWeight: "900", marginBottom: 10 },
  detailsText: { lineHeight: rs(22, 18, 26), marginBottom: 10 },
  detailsMeta: { marginBottom: 6 },
  detailsActionRow: { flexDirection: "row", marginTop: 16 },
  detailsActionBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  detailsActionBtnSmall: {
    flex: 0.8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  detailsActionText: { color: "#fff", fontWeight: "800" },
});
