/*
  File: app/Marketplace.tsx
  Purpose: Unimaid Resources — Marketplace Screen (real DB + better UI)
*/

import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
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
import Svg, { Circle, Line, Path } from "react-native-svg";
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
  "Furniture",
  "Clothing",
  "Other",
];

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
        <Text style={[s.wordmark, { color: T.white }]}>
          {"UNIMAID "}
          <Text style={{ color: T.purpleGlow }}>RESOURCES</Text>
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
          <IconBell color={T.whiteMuted} size={19} />
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
  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: T.card, borderColor: T.border }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={[s.cardImg, { backgroundColor: T.bgDeep }]}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={s.cardImageReal} />
        ) : (
          <Text style={s.cardEmoji}>🛍️</Text>
        )}

        <TouchableOpacity style={s.heartBtn}>
          <IconHeart color={T.faint} />
        </TouchableOpacity>

        <View style={[s.catBadge, { backgroundColor: T.purpleFaint }]}>
          <Text style={[s.catBadgeText, { color: T.purpleGlow }]}>
            {item.category}
          </Text>
        </View>
      </View>

      <View style={s.cardBody}>
        <Text style={[s.cardTitle, { color: T.whiteSoft }]} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={[s.cardPrice, { color: T.purpleGlow }]}>
          ₦{formatPrice(item.price)}
        </Text>

        {!!item.condition_label && (
          <Text style={[s.cardMeta, { color: T.whiteMuted }]}>
            {item.condition_label}
          </Text>
        )}

        <View style={s.cardFooter}>
          <Text style={[s.cardSeller, { color: T.faint }]} numberOfLines={1}>
            {item.seller_name || "Unknown seller"}
          </Text>
          <Text style={[s.cardTime, { color: T.faint }]}>
            {timeAgo(item.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Marketplace() {
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
  const [imageUri, setImageUri] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync("theme")
      .then((saved) => {
        if (saved && THEMES[saved as ThemeMode]) {
          setThemeMode(saved as ThemeMode);
        }
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

        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
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

      const url = `${API_BASE}/get_marketplace_items.php?q=${encodeURIComponent(
        query,
      )}&category=${encodeURIComponent(activeCategory)}`;

      const res = await fetch(url);
      const text = await res.text();
      const data = JSON.parse(text);

      if (data.status === "success") {
        setItems(data.items || []);
      } else {
        setItems([]);
      }
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
    setImageUri("");
    setUploadedImageUrl("");
    setUploadingImage(false);
  };

  const uploadImageWithXHR = (
    fileUri: string,
    ext: string,
    mimeType: string,
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const form = new FormData();

      form.append("image", {
        uri: fileUri,
        name: `market_${Date.now()}.${ext}`,
        type: mimeType,
      } as any);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/upload_marketplace_image.php`);

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error(xhr.responseText || "Invalid server response"));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network request failed"));
      };

      xhr.send(form);
    });
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: asset.base64,
            mimeType,
            extension: ext,
          }),
        },
      );

      const text = await res.text();
      console.log("Marketplace base64 upload raw:", text);

      const data = JSON.parse(text);

      if (data.success && data.imageUrl) {
        setUploadedImageUrl(data.imageUrl);
        Alert.alert("Success", "Image uploaded successfully");
      } else {
        setUploadedImageUrl("");
        Alert.alert("Upload failed", data.message || "Could not upload image");
      }
    } catch (err: any) {
      console.log("Marketplace image upload error:", err);
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
      console.log("Marketplace save raw:", text);

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
      console.log("Marketplace save error:", err);
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

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={T.statusBar} backgroundColor={T.bg} />

      <TopBar theme={themeMode} onThemeChange={handleThemeChange} T={T} />

      <View style={s.searchRow}>
        <View
          style={[
            s.searchBox,
            { backgroundColor: T.card, borderColor: T.border },
          ]}
        >
          <IconSearch color={T.faint} />
          <TextInput
            style={[s.searchInput, { color: T.white }]}
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
          <IconFilter color={T.purpleGlow} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.categoryScroll}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
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
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={s.countRow}>
        <Text style={[s.countText, { color: T.whiteMuted }]}>
          {filtered.length} listings
        </Text>
        <Text style={[s.sortText, { color: T.purpleGlow }]}>Newest first</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={T.purpleGlow}
          style={{ flex: 1 }}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {pairs.length === 0 ? (
            <Text style={[s.emptyText, { color: T.faint }]}>
              No marketplace items yet
            </Text>
          ) : (
            pairs.map((pair, i) => (
              <View key={i} style={s.gridRow}>
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
          <View style={{ height: 90 }} />
        </ScrollView>
      )}

      <TouchableOpacity
        style={[
          s.fab,
          { backgroundColor: T.purpleMid, shadowColor: T.purpleMid },
        ]}
        activeOpacity={0.85}
        onPress={() => {
          resetForm();
          setAddVisible(true);
        }}
      >
        <IconPlus color="#fff" />
      </TouchableOpacity>

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
                  { backgroundColor: T.card, borderColor: T.border },
                ]}
              >
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={[s.modalTitle, { color: T.white }]}>
                    Add Listing
                  </Text>

                  <TouchableOpacity
                    style={[
                      s.imagePicker,
                      { backgroundColor: T.bgDeep, borderColor: T.border },
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
                      <Text style={[s.imagePickerText, { color: T.faint }]}>
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
                          fontSize: 13,
                        }}
                      >
                        Uploading image...
                      </Text>
                    </View>
                  )}

                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: T.bg,
                        borderColor: T.border,
                        color: T.white,
                      },
                    ]}
                    placeholder="Title"
                    placeholderTextColor={T.faint}
                    value={title}
                    onChangeText={setTitle}
                  />

                  <TextInput
                    style={[
                      s.input,
                      s.textarea,
                      {
                        backgroundColor: T.bg,
                        borderColor: T.border,
                        color: T.white,
                      },
                    ]}
                    placeholder="Description"
                    placeholderTextColor={T.faint}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />

                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: T.bg,
                        borderColor: T.border,
                        color: T.white,
                      },
                    ]}
                    placeholder="Price"
                    placeholderTextColor={T.faint}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />

                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: T.bg,
                        borderColor: T.border,
                        color: T.white,
                      },
                    ]}
                    placeholder="Category (Books, Electronics, Furniture...)"
                    placeholderTextColor={T.faint}
                    value={category}
                    onChangeText={setCategory}
                  />

                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: T.bg,
                        borderColor: T.border,
                        color: T.white,
                      },
                    ]}
                    placeholder="Condition"
                    placeholderTextColor={T.faint}
                    value={conditionLabel}
                    onChangeText={setConditionLabel}
                  />

                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: T.bg,
                        borderColor: T.border,
                        color: T.white,
                      },
                    ]}
                    placeholder="Location"
                    placeholderTextColor={T.faint}
                    value={location}
                    onChangeText={setLocation}
                  />

                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: T.bg,
                        borderColor: T.border,
                        color: T.white,
                      },
                    ]}
                    placeholder="Phone"
                    placeholderTextColor={T.faint}
                    value={sellerPhone}
                    onChangeText={setSellerPhone}
                  />

                  <TextInput
                    style={[
                      s.input,
                      {
                        backgroundColor: T.bg,
                        borderColor: T.border,
                        color: T.white,
                      },
                    ]}
                    placeholder="WhatsApp"
                    placeholderTextColor={T.faint}
                    value={whatsapp}
                    onChangeText={setWhatsapp}
                  />

                  <View style={s.modalBtns}>
                    <TouchableOpacity
                      style={[s.btnCancel, { borderColor: T.border }]}
                      onPress={() => setAddVisible(false)}
                      disabled={saving || uploadingImage}
                    >
                      <Text style={{ color: T.white }}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[s.btnSave, { backgroundColor: T.purpleMid }]}
                      onPress={saveItem}
                      disabled={saving || uploadingImage}
                    >
                      <Text style={{ color: "#fff", fontWeight: "800" }}>
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
                  { backgroundColor: T.card, borderColor: T.border },
                ]}
              >
                {selectedItem && (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {selectedItem.image_url ? (
                      <Image
                        source={{ uri: selectedItem.image_url }}
                        style={s.detailsImage}
                      />
                    ) : null}

                    <Text style={[s.detailsTitle, { color: T.white }]}>
                      {selectedItem.title}
                    </Text>

                    <Text style={[s.detailsPrice, { color: T.purpleGlow }]}>
                      ₦{formatPrice(selectedItem.price)}
                    </Text>

                    {!!selectedItem.description && (
                      <Text style={[s.detailsText, { color: T.whiteMuted }]}>
                        {selectedItem.description}
                      </Text>
                    )}

                    <Text style={[s.detailsMeta, { color: T.faint }]}>
                      Seller: {selectedItem.seller_name || "Unknown"}
                    </Text>

                    {!!selectedItem.location && (
                      <Text style={[s.detailsMeta, { color: T.faint }]}>
                        Location: {selectedItem.location}
                      </Text>
                    )}

                    {!!selectedItem.condition_label && (
                      <Text style={[s.detailsMeta, { color: T.faint }]}>
                        Condition: {selectedItem.condition_label}
                      </Text>
                    )}

                    {!!selectedItem.seller_phone && (
                      <Text style={[s.detailsMeta, { color: T.faint }]}>
                        Phone: {selectedItem.seller_phone}
                      </Text>
                    )}

                    {!!selectedItem.whatsapp && (
                      <Text style={[s.detailsMeta, { color: T.faint }]}>
                        WhatsApp: {selectedItem.whatsapp}
                      </Text>
                    )}

                    <TouchableOpacity
                      style={[
                        s.btnSave,
                        { backgroundColor: T.purpleMid, marginTop: 16 },
                      ]}
                      onPress={() => setDetailsVisible(false)}
                    >
                      <Text style={{ color: "#fff", fontWeight: "800" }}>
                        Close
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <BottomNav active="marketplace" T={T} />
    </SafeAreaView>
  );
}

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
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryScroll: { maxHeight: 46, marginBottom: 4 },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catPillText: { fontSize: 13 },

  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  countText: { fontSize: 12, fontWeight: "600" },
  sortText: { fontSize: 12, fontWeight: "600" },

  gridRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 10,
  },
  card: { flex: 1, borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  cardImg: { height: 120, alignItems: "center", justifyContent: "center" },
  cardImageReal: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
  catBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardBody: { padding: 10 },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 17,
  },
  cardPrice: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  cardMeta: { fontSize: 11, marginBottom: 4 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardSeller: { fontSize: 11, fontStyle: "italic", flex: 1, marginRight: 6 },
  cardTime: { fontSize: 10 },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
  },

  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 16,
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
    paddingHorizontal: 18,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    maxHeight: "88%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },
  imagePicker: {
    width: "100%",
    height: 180,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 12,
  },
  imagePickerText: {
    fontSize: 14,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  textarea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  modalBtns: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  btnCancel: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnSave: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  detailsImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    resizeMode: "cover",
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
  },
  detailsPrice: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  detailsText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
  detailsMeta: {
    fontSize: 13,
    marginBottom: 6,
  },
});
