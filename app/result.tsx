import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { C } from "./constants/theme";

type Question = {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_option: string; // "A" | "B" | "C" | "D" | "E"
  explanation?: string;
  userAnswer?: string; // we'll add this in results
  isCorrect?: boolean; // we'll add this in results
};

export default function ResultScreen() {
  const { quizId, title, total, answers, questions } = useLocalSearchParams<{
    quizId: string;
    title: string;
    total: string;
    answers: string;
    questions: string;
  }>();
  const router = useRouter();

  const parsedAnswers = useMemo(() => {
    try {
      return JSON.parse(answers || "{}") as Record<number, string>;
    } catch {
      return {};
    }
  }, [answers]);

  const parsedQuestions = useMemo(() => {
    try {
      return JSON.parse(questions || "[]") as Omit<
        Question,
        "userAnswer" | "isCorrect"
      >[];
    } catch {
      return [];
    }
  }, [questions]);

  const totalQuestions = parseInt(total || "0", 10);
  let score = 0;

  const results = parsedQuestions.map((q) => {
    const userAnswerLetter = parsedAnswers[q.id];
    const isCorrect = userAnswerLetter === q.correct_option;

    if (isCorrect) score++;

    // Get the full text of the user's answer (if any)
    let userAnswerText = "—";
    if (userAnswerLetter) {
      const key = `option_${userAnswerLetter.toLowerCase()}` as keyof typeof q;
      userAnswerText = (q[key] as string) || "—";
    }

    // Get the full text of the correct answer
    const correctKey =
      `option_${q.correct_option.toLowerCase()}` as keyof typeof q;
    const correctAnswerText = (q[correctKey] as string) || "—";

    return {
      ...q,
      userAnswerLetter,
      userAnswerText,
      correctAnswerText,
      isCorrect,
    };
  });

  const percentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Quiz Results</Text>
        <Text style={styles.quizName}>{title || "Quiz"}</Text>

        <View style={styles.scoreCard}>
          <Text style={styles.score}>{score}</Text>
          <Text style={styles.total}> / {totalQuestions}</Text>
          <Text style={styles.percentage}>{percentage}%</Text>
          <Text style={styles.message}>
            {percentage >= 80
              ? "Excellent!"
              : percentage >= 50
                ? "Good job!"
                : "Keep practicing!"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Review Answers</Text>

        {results.map((q, index) => (
          <View key={q.id} style={styles.reviewCard}>
            <Text style={styles.questionNumber}>Q{index + 1}</Text>
            <Text style={styles.reviewQuestion}>{q.question}</Text>

            {/* User's answer - shows letter + full text */}
            <View style={styles.answerRow}>
              <Text style={styles.label}>Your answer:</Text>
              <Text
                style={[
                  styles.answer,
                  q.isCorrect ? styles.correct : styles.incorrect,
                ]}
              >
                {q.userAnswerLetter ? `${q.userAnswerLetter}. ` : ""}
                {q.userAnswerText}
                {q.isCorrect ? " (Correct)" : ""}
              </Text>
            </View>

            {/* Correct answer - only shown if user was wrong */}
            {!q.isCorrect && (
              <View style={styles.answerRow}>
                <Text style={styles.label}>Correct answer:</Text>
                <Text style={[styles.answer, styles.correct]}>
                  {q.correct_option}. {q.correctAnswerText}
                </Text>
              </View>
            )}

            {q.explanation && (
              <View style={styles.explanation}>
                <Text style={styles.explanationTitle}>Explanation:</Text>
                <Text style={styles.explanationText}>{q.explanation}</Text>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push("/quizzes")}
        >
          <Text style={styles.backText}>Back to Quizzes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 20, paddingBottom: 100 },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: C.white,
    textAlign: "center",
    marginTop: 20,
  },
  quizName: {
    fontSize: 20,
    color: C.faint,
    textAlign: "center",
    marginBottom: 24,
  },

  scoreCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: C.border,
  },
  score: { fontSize: 48, fontWeight: "900", color: C.purpleGlow },
  total: { fontSize: 28, color: C.white, marginBottom: 8 },
  percentage: {
    fontSize: 36,
    fontWeight: "700",
    color: C.white,
    marginBottom: 8,
  },
  message: { fontSize: 18, color: C.faint },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.white,
    marginBottom: 16,
  },

  reviewCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  questionNumber: { color: C.purpleGlow, fontWeight: "800", marginBottom: 8 },
  reviewQuestion: {
    color: C.white,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },

  answerRow: {
    flexDirection: "row",
    marginBottom: 8,
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  label: { color: C.faint, marginRight: 10, fontSize: 15, minWidth: 100 },
  answer: { fontWeight: "600", fontSize: 15, flexShrink: 1 },
  correct: { color: "#4caf50" },
  incorrect: { color: "#f44336" },

  explanation: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  explanationTitle: { color: C.purpleGlow, fontWeight: "700", marginBottom: 6 },
  explanationText: { color: C.white, fontSize: 14, lineHeight: 20 },

  backBtn: {
    backgroundColor: C.purpleMid,
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 32,
  },
  backText: { color: "#fff", fontWeight: "800", fontSize: 17 },
});
