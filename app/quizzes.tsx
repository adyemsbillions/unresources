import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { C } from "./constants/theme";

const API_BASE = "https://unresources.cravii.ng/api";

type Quiz = {
  id: number;
  title: string;
  course_code: string;
  level?: string;
  total_questions: number;
  time_limit: number;
};

function SearchIcon() {
  return (
    <View style={styles.searchIcon}>
      {/* Simple circle + line search icon using Views */}
      <View style={styles.searchCircle} />
      <View style={styles.searchLine} />
    </View>
  );
}

export default function QuizzesScreen() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const url = search
        ? `${API_BASE}/quizzes.php?search=${encodeURIComponent(search)}`
        : `${API_BASE}/quizzes.php`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "success") {
        setQuizzes(data.quizzes || []);
      } else {
        console.log("API error:", data.message || data);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [search]);

  const minutes = (secs: number) => Math.floor(secs / 60);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.subtitle}>UNIMAID Resources</Text>
        <Text style={styles.title}>Quizzes</Text>

        {/* Search bar */}
        <View style={styles.searchWrapper}>
          {/* Small search icon */}
          <View style={styles.iconBox}>
            <View style={styles.searchCircle} />
            <View style={styles.searchLine} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search course or title..."
            placeholderTextColor={C.faint}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={C.purpleGlow}
          style={styles.loader}
        />
      ) : quizzes.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyTitle}>No quizzes found</Text>
          <Text style={styles.emptyHint}>Try a different search term</Text>
        </View>
      ) : (
        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() =>
                router.push({
                  pathname: "/takequiz",
                  params: {
                    quizId: item.id.toString(),
                    title: item.title,
                    timeLimit: item.time_limit.toString(),
                  },
                })
              }
            >
              {/* Left accent bar */}
              <View style={styles.accentBar} />

              <View style={styles.cardInner}>
                {/* Top row: pill badge + time */}
                <View style={styles.cardTop}>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>
                      {item.course_code}
                      {item.level ? ` • ${item.level}` : ""}
                    </Text>
                  </View>
                  <Text style={styles.timeText}>
                    {minutes(item.time_limit)} min
                  </Text>
                </View>

                {/* Quiz title */}
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                {/* Bottom row: question count + CTA */}
                <View style={styles.cardBottom}>
                  <Text style={styles.questionCount}>
                    {item.total_questions} questions
                  </Text>
                  <Text style={styles.startBtn}>Take Quiz →</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // ── Header ─────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: C.faint,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: C.white,
    marginBottom: 16,
  },

  // ── Search ──────────────────────────────────────────────
  searchWrapper: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  iconBox: {
    width: 16,
    height: 16,
    position: "relative",
    flexShrink: 0,
  },
  searchCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: C.faint,
    position: "absolute",
    top: 0,
    left: 0,
  },
  searchLine: {
    width: 5,
    height: 1.5,
    backgroundColor: C.faint,
    borderRadius: 1,
    position: "absolute",
    bottom: 1,
    right: 0,
    transform: [{ rotate: "45deg" }],
  },
  searchInput: {
    flex: 1,
    color: C.white,
    fontSize: 14,
    padding: 0,
  },

  // ── List ────────────────────────────────────────────────
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  loader: { marginTop: 120 },

  // ── Empty state ─────────────────────────────────────────
  emptyWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  emptyTitle: {
    color: C.white,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyHint: {
    color: C.faint,
    fontSize: 14,
  },

  // ── Quiz Card ───────────────────────────────────────────
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    overflow: "hidden",
  },
  accentBar: {
    width: 3,
    backgroundColor: C.purpleGlow,
  },
  cardInner: {
    flex: 1,
    padding: 15,
    gap: 8,
  },

  // Card top row
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pill: {
    backgroundColor: C.purpleDark ?? "#2d1e4a",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: {
    color: C.purpleGlow,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  timeText: {
    color: C.faint,
    fontSize: 12,
  },

  // Card title
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.white,
    lineHeight: 21,
  },

  // Card bottom row
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  questionCount: {
    color: C.faint,
    fontSize: 12,
  },
  startBtn: {
    color: C.purpleGlow,
    fontSize: 13,
    fontWeight: "800",
  },
});
