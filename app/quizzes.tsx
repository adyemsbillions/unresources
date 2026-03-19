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
  time_limit: number; // in seconds
};

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={styles.header}>
        <Text style={styles.title}>Quizzes</Text>
        <TextInput
          style={styles.search}
          placeholder="Search course or title..."
          placeholderTextColor={C.faint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={C.purpleGlow}
          style={{ marginTop: 100, flex: 1 }}
        />
      ) : quizzes.length === 0 ? (
        <Text style={styles.empty}>No quizzes available yet</Text>
      ) : (
        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/takequiz",
                  params: {
                    quizId: item.id.toString(),
                    title: item.title,
                    timeLimit: item.time_limit.toString(), // pass time limit
                  },
                })
              }
            >
              <Text style={styles.course}>
                {item.course_code} • {item.level || "All Levels"}
              </Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.info}>
                {item.total_questions} Questions •{" "}
                {Math.floor(item.time_limit / 60)} min
              </Text>
              <Text style={styles.startBtn}>Take Quiz →</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: "900", color: C.white },
  search: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    color: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  card: {
    backgroundColor: C.card,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  course: { color: C.purpleGlow, fontWeight: "800", marginBottom: 6 },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.white,
    marginVertical: 8,
  },
  info: { color: C.faint, fontSize: 13 },
  startBtn: {
    color: C.purpleGlow,
    fontWeight: "800",
    marginTop: 12,
    textAlign: "right",
  },
  list: { paddingBottom: 100 },
  empty: {
    color: C.faint,
    textAlign: "center",
    marginTop: 120,
    fontSize: 16,
  },
});
