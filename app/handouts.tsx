/*
  File: app/handouts.tsx
  Purpose: Browse & share lecture notes/handouts via Google Drive links
  Features:
  - Animated card list with staggered entrance
  - Search + course/level filters
  - Floating + button → beautiful modal form
  - Open links in browser
  - Refresh + loading states
  - Empty state encouragement
*/

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Linking,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { C } from "./constants/theme";

const API_BASE = "https://unresources.cravii.ng/api";
const { width: SCREEN_W } = Dimensions.get("window");

type Handout = {
  id: number;
  title: string;
  course_code: string;
  level?: string;
  department?: string;
  lecturer?: string;
  description?: string;
  drive_link: string;
  created_at: string;
  views: number;
};

// ─── Animated Handout Card ───────────────────────────────────────────────────
function HandoutCard({
  item,
  index,
  onPress,
}: {
  item: Handout;
  index: number;
  onPress: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 80,
        friction: 12,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 80,
        friction: 10,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const levelStyle = item.level
    ? {
        "100L": { bg: "rgba(251,191,36,0.15)", text: "#fbbf24" },
        "200L": { bg: "rgba(34,197,94,0.15)", text: "#22c55e" },
        "300L": { bg: "rgba(59,130,246,0.15)", text: "#3b82f6" },
        "400L": { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
        "500L": { bg: "rgba(168,85,247,0.15)", text: "#a855f7" },
      }[item.level] || { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" }
    : { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.92}
      >
        <View style={[styles.accentBar, { backgroundColor: levelStyle.bg }]} />

        <View style={styles.badges}>
          <View style={styles.courseBadge}>
            <Text style={styles.courseText}>{item.course_code}</Text>
          </View>
          {item.level && (
            <View
              style={[styles.levelBadge, { backgroundColor: levelStyle.bg }]}
            >
              <Text style={[styles.levelText, { color: levelStyle.text }]}>
                {item.level}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {item.lecturer && (
          <Text style={styles.lecturer}>👤 {item.lecturer}</Text>
        )}

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
          <View style={styles.openIndicator}>
            <Text style={styles.openText}>Open ↗</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Form Input Field ─────────────────────────────────────────────────────────
function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = "none",
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.fieldInput,
          focused && styles.fieldInputFocused,
          multiline && styles.textArea,
        ]}
        placeholder={placeholder}
        placeholderTextColor={C.faint}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "center"}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function HandoutsScreen() {
  const router = useRouter();

  const [handouts, setHandouts] = useState<Handout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("");
  const [level, setLevel] = useState("");

  // Add modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newLevel, setNewLevel] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newLecturer, setNewLecturer] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLink, setNewLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const id = await SecureStore.getItemAsync("user_id");
      setUserId(id);
    };
    init();
  }, []);

  const fetchHandouts = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/handouts.php?limit=30`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (course.trim()) url += `&course=${encodeURIComponent(course.trim())}`;
      if (level.trim()) url += `&level=${encodeURIComponent(level.trim())}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "success") {
        setHandouts(data.handouts || []);
      } else {
        Alert.alert("Error", data.message || "Failed to load handouts");
      }
    } catch (err) {
      Alert.alert("Connection Error", "Unable to reach server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHandouts();
  }, []);

  const handleAdd = async () => {
    if (!newTitle.trim() || !newCourse.trim() || !newLink.trim()) {
      Alert.alert(
        "Required",
        "Title, Course Code, and Drive Link are required.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/handouts.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          course_code: newCourse.trim().toUpperCase(),
          level: newLevel.trim(),
          department: newDept.trim(),
          lecturer: newLecturer.trim(),
          description: newDesc.trim(),
          drive_link: newLink.trim(),
          added_by: userId ? Number(userId) : null,
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        Alert.alert("Success!", "Handout link shared successfully.");
        setAddModalVisible(false);
        // Reset form
        setNewTitle("");
        setNewCourse("");
        setNewLevel("");
        setNewDept("");
        setNewLecturer("");
        setNewDesc("");
        setNewLink("");
        fetchHandouts();
      } else {
        Alert.alert("Failed", data.message || "Could not add handout");
      }
    } catch {
      Alert.alert("Error", "Network issue — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const openDriveLink = async (link: string) => {
    try {
      await Linking.openURL(link);
    } catch {
      Alert.alert(
        "Cannot open",
        "Please copy the link and open in your browser.",
      );
    }
  };

  const LEVELS = ["All", "100L", "200L", "300L", "400L", "500L", "SP"];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>UNIMAID RESOURCES</Text>
          <Text style={styles.headerTitle}>Handouts</Text>
        </View>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search title or course…"
            placeholderTextColor={C.faint}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchHandouts}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                fetchHandouts();
              }}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.levelPills}
        >
          {LEVELS.map((lvl) => {
            const active = (lvl === "All" && level === "") || lvl === level;
            return (
              <TouchableOpacity
                key={lvl}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setLevel(lvl === "All" ? "" : lvl)}
              >
                <Text
                  style={[styles.pillText, active && styles.pillTextActive]}
                >
                  {lvl}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.courseFilterRow}>
          <TextInput
            style={styles.courseInput}
            placeholder="Course code"
            placeholderTextColor={C.faint}
            value={course}
            onChangeText={setCourse}
            onSubmitEditing={fetchHandouts}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.filterBtn} onPress={fetchHandouts}>
            <Text style={styles.filterBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.purpleGlow} />
          <Text style={styles.loadingText}>Loading handouts…</Text>
        </View>
      ) : (
        <FlatList
          data={handouts}
          renderItem={({ item, index }) => (
            <HandoutCard
              item={item}
              index={index}
              onPress={() => openDriveLink(item.drive_link)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchHandouts();
              }}
              tintColor={C.purpleGlow}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyTitle}>No handouts yet</Text>
              <Text style={styles.emptyText}>
                Be the first to share useful materials for your course!
              </Text>
              <TouchableOpacity
                style={styles.emptyFab}
                onPress={() => setAddModalVisible(true)}
              >
                <Text style={styles.emptyFabText}>＋ Add First Handout</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.list}
        />
      )}

      {/* Add Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share a Handout</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.formContent}
            >
              <FormField
                label="Title"
                required
                placeholder="e.g. Introduction to Algorithms Notes"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <View style={styles.formRow}>
                <FormField
                  label="Course Code"
                  required
                  placeholder="CSC 101"
                  value={newCourse}
                  onChangeText={setNewCourse}
                  autoCapitalize="characters"
                  style={{ flex: 1 }}
                />
                <FormField
                  label="Level"
                  placeholder="200L"
                  value={newLevel}
                  onChangeText={setNewLevel}
                  style={{ width: 100 }}
                />
              </View>

              <FormField
                label="Department"
                placeholder="Computer Science"
                value={newDept}
                onChangeText={setNewDept}
              />

              <FormField
                label="Lecturer (optional)"
                placeholder="Dr. John Doe"
                value={newLecturer}
                onChangeText={setNewLecturer}
              />

              <FormField
                label="Description (optional)"
                placeholder="Brief note about the material..."
                value={newDesc}
                onChangeText={setNewDesc}
                multiline
                numberOfLines={4}
              />

              <FormField
                label="Google Drive Link"
                required
                placeholder="https://drive.google.com/file/d/..."
                value={newLink}
                onChangeText={setNewLink}
                autoCapitalize="none"
                keyboardType="url"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setAddModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalSubmit,
                    submitting && styles.modalSubmitDisabled,
                  ]}
                  onPress={handleAdd}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Share Handout</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: C.purpleGlow,
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: C.white,
    letterSpacing: -0.5,
  },
  fab: {
    backgroundColor: C.purpleMid,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.purpleGlow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: { fontSize: 28, color: "#fff", fontWeight: "300" },

  filtersContainer: { padding: 16 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 18, color: C.faint, marginRight: 10 },
  searchInput: { flex: 1, color: C.white, fontSize: 16, paddingVertical: 14 },
  clearIcon: { fontSize: 16, color: C.faint, padding: 8 },

  levelPills: { marginBottom: 12 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: C.purpleMid,
    borderColor: C.purpleMid,
  },
  pillText: { color: C.whiteMuted, fontWeight: "700", fontSize: 13 },
  pillTextActive: { color: "#fff" },

  courseFilterRow: {
    flexDirection: "row",
    gap: 12,
  },
  courseInput: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    color: C.white,
    borderWidth: 1,
    borderColor: C.border,
    fontSize: 15,
  },
  filterBtn: {
    backgroundColor: C.purpleFaint,
    paddingHorizontal: 24,
    borderRadius: 14,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.purpleGlow,
  },
  filterBtnText: { color: C.purpleGlow, fontWeight: "800", fontSize: 14 },

  list: { paddingHorizontal: 16, paddingBottom: 140 },

  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
    overflow: "hidden",
  },
  accentBar: { height: 4 },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 16,
    paddingBottom: 0,
  },
  courseBadge: {
    backgroundColor: C.purpleFaint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  courseText: { color: C.purpleGlow, fontWeight: "800", fontSize: 13 },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  levelText: { fontWeight: "700", fontSize: 13 },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    lineHeight: 24,
  },
  lecturer: {
    fontSize: 13,
    color: C.whiteMuted,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: C.whiteSoft,
    paddingHorizontal: 16,
    marginTop: 8,
    lineHeight: 20,
    opacity: 0.9,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 12,
  },
  date: { fontSize: 12, color: C.faint },
  openIndicator: {
    backgroundColor: C.purpleFaint,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${C.purpleGlow}40`,
  },
  openText: { color: C.purpleGlow, fontWeight: "700", fontSize: 13 },

  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { color: C.faint, fontSize: 15 },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: C.white },
  emptyText: {
    fontSize: 15,
    color: C.faint,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyFab: {
    marginTop: 24,
    backgroundColor: C.purpleMid,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
    shadowColor: C.purpleGlow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyFabText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: C.border,
  },
  modalDragHandle: {
    width: 44,
    height: 5,
    backgroundColor: C.border,
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  modalTitle: { fontSize: 24, fontWeight: "900", color: C.white },
  modalClose: { fontSize: 28, color: C.whiteMuted, fontWeight: "300" },

  formContent: { padding: 24, paddingBottom: 40 },
  formRow: { flexDirection: "row", gap: 12 },

  field: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: C.whiteMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  required: { color: C.purpleGlow },
  fieldInput: {
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 16,
    color: C.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },

  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  modalCancelText: { color: C.white, fontWeight: "700", fontSize: 16 },
  modalSubmit: {
    flex: 2,
    backgroundColor: C.purpleMid,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    shadowColor: C.purpleGlow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  modalSubmitDisabled: { opacity: 0.6 },
  modalSubmitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
