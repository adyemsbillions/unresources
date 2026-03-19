import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
    Alert,
    Clipboard,
    SafeAreaView,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { C } from "./constants/theme";

type Question = {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_option: string;
  explanation?: string;
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
      return JSON.parse(questions || "[]") as Question[];
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

    let userAnswerText = "—";
    if (userAnswerLetter) {
      const key = `option_${userAnswerLetter.toLowerCase()}` as keyof Question;
      userAnswerText = (q[key] as string) || "—";
    }

    const correctKey =
      `option_${q.correct_option.toLowerCase()}` as keyof Question;
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

  // Motivational message based on performance
  let performanceMessage = "Keep practicing! 💪";
  let badgeEmoji = "💪";
  if (percentage >= 80) {
    performanceMessage = "Legendary performance! 🔥";
    badgeEmoji = "🏆";
  } else if (percentage >= 50) {
    performanceMessage = "Solid effort! You're getting there!";
    badgeEmoji = "🏅";
  }

  // Circle progress math
  const RADIUS = 30;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~188.5
  const strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE * percentage) / 100;

  // Shareable text
  const shareMessage = `
I just smashed the "${title || "Quiz"}" quiz with ${score}/${totalQuestions} (${percentage}%) on Unimaid Resources App! 🎉
${performanceMessage}
${percentage >= 80 ? "Who's challenging me next? 😎" : "Next round, I'm coming stronger! 🚀"}

Download Unimaid Resources and test yourself today! 📱✨
#UnimaidResources #QuizMaster #MaiduguriStudents #UNIMAID
  `.trim();

  const handleShare = async () => {
    try {
      await Share.share({
        message: shareMessage,
        title: "My Quiz Result on Unimaid Resources!",
      });
    } catch {
      Alert.alert(
        "Share Failed",
        "Couldn't open share sheet. Try copying instead.",
      );
    }
  };

  const handleCopy = async () => {
    await Clipboard.setString(shareMessage);
    Alert.alert(
      "Copied!",
      "Result message copied to clipboard. Paste it anywhere!",
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.title}>Quiz Results</Text>
        <Text style={styles.quizName}>{title || "Quiz"}</Text>

        {/* Compact Score Card */}
        <View style={styles.scoreCard}>
          {/* Circular progress */}
          <View style={styles.circleWrapper}>
            <Svg width={72} height={72} viewBox="0 0 72 72">
              {/* Track */}
              <Circle
                cx={36}
                cy={36}
                r={RADIUS}
                fill="none"
                stroke={C.purpleDark ?? "#3d2460"}
                strokeWidth={6}
              />
              {/* Progress arc */}
              <Circle
                cx={36}
                cy={36}
                r={RADIUS}
                fill="none"
                stroke={C.purpleGlow}
                strokeWidth={6}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation={-90}
                origin="36, 36"
              />
            </Svg>
            <View style={styles.circleLabel}>
              <Text style={styles.circlePercent}>{percentage}%</Text>
            </View>
          </View>

          {/* Score + message */}
          <View style={styles.scoreInfo}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreNumber}>{score}</Text>
              <Text style={styles.scoreTotal}> / {totalQuestions}</Text>
            </View>
            <Text style={styles.message}>{performanceMessage}</Text>
          </View>

          {/* Emoji badge */}
          <Text style={styles.badge}>{badgeEmoji}</Text>
        </View>

        {/* Share Buttons */}
        <View style={styles.shareSection}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareText}>Share Result 🎉</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <Text style={styles.copyText}>Copy Message</Text>
          </TouchableOpacity>
        </View>

        {/* Review Section */}
        <Text style={styles.sectionTitle}>Review Answers</Text>

        {results.map((q, index) => (
          <View key={q.id} style={styles.reviewCard}>
            {/* Q number badge */}
            <Text style={styles.questionNumber}>Q{index + 1}</Text>
            <Text style={styles.reviewQuestion}>{q.question}</Text>

            {/* User answer */}
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
                {q.isCorrect ? " ✓" : ""}
              </Text>
            </View>

            {/* Correct answer (only if wrong) */}
            {!q.isCorrect && (
              <View style={styles.answerRow}>
                <Text style={styles.label}>Correct:</Text>
                <Text style={[styles.answer, styles.correct]}>
                  {q.correct_option}. {q.correctAnswerText} ✓
                </Text>
              </View>
            )}

            {/* Explanation */}
            {q.explanation && (
              <View style={styles.explanation}>
                <Text style={styles.explanationTitle}>Explanation: </Text>
                <Text style={styles.explanationText}>{q.explanation}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Back button */}
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

  // ── Header ──────────────────────────────────────────────
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: C.white,
    textAlign: "center",
    marginTop: 16,
  },
  quizName: {
    fontSize: 15,
    color: C.faint,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },

  // ── Compact Score Card ───────────────────────────────────
  scoreCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.purpleGlow,
  },

  // Circle
  circleWrapper: {
    width: 72,
    height: 72,
    flexShrink: 0,
    position: "relative",
  },
  circleLabel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  circlePercent: {
    color: C.white,
    fontSize: 14,
    fontWeight: "800",
  },

  // Score text
  scoreInfo: { flex: 1 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  scoreNumber: {
    fontSize: 34,
    fontWeight: "900",
    color: C.purpleGlow,
    lineHeight: 38,
  },
  scoreTotal: {
    fontSize: 18,
    color: C.white,
    fontWeight: "500",
  },
  message: {
    color: C.faint,
    fontSize: 12,
    lineHeight: 17,
  },

  // Badge
  badge: {
    fontSize: 28,
    flexShrink: 0,
  },

  // ── Share Buttons ────────────────────────────────────────
  shareSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: C.purpleMid,
    paddingVertical: 13,
    borderRadius: 13,
    alignItems: "center",
  },
  shareText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  copyBtn: {
    flex: 1,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.purpleGlow,
    paddingVertical: 13,
    borderRadius: 13,
    alignItems: "center",
  },
  copyText: { color: C.purpleGlow, fontWeight: "700", fontSize: 14 },

  // ── Review Section ───────────────────────────────────────
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.white,
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  questionNumber: {
    color: C.purpleGlow,
    fontWeight: "800",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  reviewQuestion: {
    color: C.white,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 10,
  },
  answerRow: {
    flexDirection: "row",
    marginBottom: 6,
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  label: {
    color: C.faint,
    marginRight: 8,
    fontSize: 13,
    minWidth: 90,
  },
  answer: { fontWeight: "600", fontSize: 13, flexShrink: 1 },
  correct: { color: "#4caf50" },
  incorrect: { color: "#f44336" },

  explanation: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  explanationTitle: {
    color: C.purpleGlow,
    fontWeight: "700",
    fontSize: 13,
  },
  explanationText: {
    color: C.faint,
    fontSize: 13,
    lineHeight: 19,
    flexShrink: 1,
  },

  // ── Back Button ──────────────────────────────────────────
  backBtn: {
    backgroundColor: C.purpleMid,
    padding: 16,
    borderRadius: 13,
    alignItems: "center",
    marginTop: 24,
  },
  backText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
