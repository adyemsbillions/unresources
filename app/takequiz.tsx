import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "./constants/theme";

const API_BASE = "https://unresources.cravii.ng/api";

type Question = {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_option: string; // "A"|"B"|"C"|"D"|"E"
  explanation?: string;
};

export default function TakeQuiz() {
  const { quizId, title, timeLimit } = useLocalSearchParams<{
    quizId: string;
    title: string;
    timeLimit: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [numQuestions, setNumQuestions] = useState<string>("10");
  const [stage, setStage] = useState<"setup" | "taking">("setup");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fisher-Yates shuffle
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (!quizId) {
      Alert.alert("Error", "No quiz selected");
      router.back();
      return;
    }

    const parsedTime = timeLimit ? parseInt(timeLimit as string, 10) : 600;
    setTimeLeft(parsedTime > 0 ? parsedTime : 600);

    const loadQuestions = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/get_quiz_questions.php?quiz_id=${quizId}`,
        );
        const data = await res.json();

        if (data.status === "success") {
          const qs = data.questions || [];
          setQuestions(qs);
          const suggested = Math.min(10, qs.length);
          setNumQuestions(suggested.toString());
        } else {
          Alert.alert("Error", data.message || "Failed to load questions");
          router.back();
        }
      } catch (err) {
        console.error("Fetch questions error:", err);
        Alert.alert("Network Error", "Could not load quiz questions");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [quizId, timeLimit, router]);

  // Timer
  useEffect(() => {
    if (stage !== "taking" || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, timeLeft]);

  const startQuiz = () => {
    const totalAvailable = questions.length;
    const wanted = parseInt(numQuestions, 10);

    if (isNaN(wanted) || wanted < 1) {
      Alert.alert("Invalid number", "Please enter a number ≥ 1");
      return;
    }
    if (wanted > totalAvailable) {
      Alert.alert(
        "Not enough questions",
        `Only ${totalAvailable} available. Using all of them.`,
      );
    }

    const shuffled = shuffleArray(questions);
    const selectedQuestions = shuffled.slice(
      0,
      Math.min(wanted, totalAvailable),
    );

    setQuestions(selectedQuestions);
    setStage("taking");
    setCurrentIndex(0);
    setAnswers({});
  };

  const selectAnswer = (option: string) => {
    const currentQ = questions[currentIndex];
    if (currentQ) {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: option }));
    }
  };

  const next = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    router.push({
      pathname: "/result",
      params: {
        quizId: quizId as string,
        title: title as string,
        total: questions.length.toString(),
        answers: JSON.stringify(answers),
        questions: JSON.stringify(questions),
      },
    });
  };

  const currentQ = questions[currentIndex];
  const selectedOpt = currentQ ? answers[currentQ.id] : undefined;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator
          size="large"
          color={C.purpleGlow}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  if (stage === "setup") {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.setupContainer}>
            <Text style={styles.title}>{title || "Quiz"}</Text>
            <Text style={styles.subtitle}>
              {questions.length} questions available
            </Text>

            <View style={styles.inputCard}>
              <Text style={styles.label}>
                How many questions do you want to attempt?
              </Text>
              <TextInput
                style={styles.numberInput}
                value={numQuestions}
                onChangeText={(text) => {
                  if (/^\d*$/.test(text)) setNumQuestions(text);
                }}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="e.g. 10"
                placeholderTextColor={C.faint}
              />
              <Text style={styles.hint}>
                Enter a number between 1 and {questions.length}
              </Text>
            </View>

            <TouchableOpacity style={styles.startBtn} onPress={startQuiz}>
              <Text style={styles.startText}>Start Quiz</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Taking quiz stage ──
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={styles.header}>
        <Text style={styles.timer}>Time: {formatTime(timeLeft)}</Text>
        <Text style={styles.progress}>
          Question {currentIndex + 1} of {questions.length}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 140 }, // extra space for footer + nav bar
        ]}
      >
        <Text style={styles.question}>{currentQ?.question || ""}</Text>

        <View style={styles.options}>
          {["A", "B", "C", "D", "E"].map((opt) => {
            const key = `option_${opt.toLowerCase()}` as keyof Question;
            const text = currentQ?.[key] as string | undefined;

            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.option,
                  selectedOpt === opt && styles.optionSelected,
                ]}
                onPress={() => selectAnswer(opt)}
              >
                <Text style={styles.optLabel}>{opt}.</Text>
                <Text style={styles.optText}>{text || "—"}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 16, // lift above system navigation bar
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.navBtn, currentIndex === 0 && styles.disabled]}
          disabled={currentIndex === 0}
          onPress={() => setCurrentIndex((p) => Math.max(0, p - 1))}
        >
          <Text style={styles.navText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={next}>
          <Text style={styles.submitText}>
            {currentIndex === questions.length - 1 ? "Finish" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Setup stage styles (unchanged)
  setupContainer: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: C.white,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: C.faint,
    marginBottom: 40,
  },
  inputCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 32,
    alignItems: "center",
  },
  label: {
    fontSize: 18,
    fontWeight: "700",
    color: C.white,
    marginBottom: 16,
  },
  numberInput: {
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: "700",
    color: C.white,
    textAlign: "center",
    width: 140,
    borderWidth: 1,
    borderColor: C.purpleGlow,
  },
  hint: {
    marginTop: 12,
    color: C.faint,
    fontSize: 14,
  },
  startBtn: {
    backgroundColor: C.purpleMid,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
  },
  startText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },

  // Taking stage styles
  header: {
    padding: 16,
    backgroundColor: C.card,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  timer: {
    color: C.purpleGlow,
    fontWeight: "800",
    fontSize: 16,
  },
  progress: {
    color: C.faint,
  },

  content: {
    padding: 20,
    // paddingBottom is now dynamic via insets
  },
  question: {
    fontSize: 18,
    fontWeight: "700",
    color: C.white,
    marginBottom: 28,
    lineHeight: 26,
  },

  options: {
    gap: 12,
  },
  option: {
    backgroundColor: C.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    gap: 12,
  },
  optionSelected: {
    borderColor: C.purpleGlow,
    backgroundColor: `${C.purpleGlow}22`,
  },
  optLabel: {
    fontWeight: "800",
    color: C.purpleGlow,
    width: 28,
    fontSize: 16,
  },
  optText: {
    color: C.white,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },

  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 12,
    // paddingBottom is now dynamic via insets
  },
  navBtn: {
    flex: 1,
    backgroundColor: C.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: C.purpleMid,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  navText: {
    color: C.white,
    fontWeight: "700",
    fontSize: 16,
  },
  submitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});
