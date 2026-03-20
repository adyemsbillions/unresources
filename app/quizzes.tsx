import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
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
  const [hasPaid, setHasPaid] = useState<boolean | null>(null);
  const [paymentRequired, setPaymentRequired] = useState<boolean>(true);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);

  const webViewRef = useRef<WebView>(null);

  const checkPaymentStatus = async (attempt = 1) => {
    try {
      const userStr = await SecureStore.getItemAsync("user");
      if (!userStr) {
        console.log("[PAYMENT] No user stored");
        return false;
      }

      const user = JSON.parse(userStr);
      const userId = user.id;

      if (!userId) {
        console.log("[PAYMENT] No user ID in stored data");
        return false;
      }

      console.log(
        `[PAYMENT] Checking status for user ${userId} (attempt ${attempt})`,
      );

      const res = await fetch(`${API_BASE}/payment.php?user_id=${userId}`);
      const text = await res.text();
      console.log("[PAYMENT] Raw response:", text.substring(0, 300));

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.log("[PAYMENT] JSON parse error:", e);
        return false;
      }

      if (data.status === "success") {
        const isPaid = !!data.data?.has_paid;
        const isPaymentRequired = !!data.data?.payment_required;

        console.log(
          `[PAYMENT] has_paid = ${isPaid ? "YES" : "NO"} | payment_required = ${isPaymentRequired ? "YES" : "NO"}`,
        );

        setPaymentRequired(isPaymentRequired);

        if (!isPaymentRequired) {
          setHasPaid(true);
          return true;
        }

        setHasPaid(isPaid);
        return isPaid;
      } else {
        console.log("[PAYMENT] API error:", data.message || data);
        return false;
      }
    } catch (err) {
      console.error("[PAYMENT] Network/check error:", err);
      return false;
    }
  };

  const verifyPayment = async (reference: string, userId: number) => {
    try {
      console.log(
        `[PAYMENT] Verifying payment reference ${reference} for user ${userId}`,
      );

      const res = await fetch(
        `${API_BASE}/verify_payment.php?reference=${encodeURIComponent(reference)}&user_id=${userId}`,
      );

      const text = await res.text();
      console.log("[PAYMENT] Verify raw response:", text.substring(0, 500));

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.log("[PAYMENT] Verify JSON parse error:", e);
        return false;
      }

      if (data.status === "success") {
        console.log("[PAYMENT] Verify success");
        setHasPaid(true);
        return true;
      }

      console.log("[PAYMENT] Verify failed:", data.message || data);
      return false;
    } catch (err) {
      console.error("[PAYMENT] Verify error:", err);
      return false;
    }
  };

  useEffect(() => {
    checkPaymentStatus();
  }, []);

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
        console.log("[QUIZZES] Loaded", data.quizzes?.length || 0, "quizzes");
      } else {
        console.log("[QUIZZES] API error:", data.message || data);
      }
    } catch (e) {
      console.error("[QUIZZES] Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPaid === true) {
      fetchQuizzes();
    }
  }, [search, hasPaid]);

  const minutes = (secs: number) => Math.floor(secs / 60);

  const startPayment = async () => {
    setPaymentLoading(true);
    try {
      const userStr = await SecureStore.getItemAsync("user");
      const user = JSON.parse(userStr || "{}");

      if (!user.id) throw new Error("No user ID");

      console.log(`[PAYMENT] Initiating for user ${user.id}`);

      const res = await fetch(`${API_BASE}/payment.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email || "user@example.com",
          name: user.name || user.username || "User",
        }),
      });

      const text = await res.text();
      console.log("[PAYMENT] Init response:", text.substring(0, 300));

      const data = JSON.parse(text);

      if (data.status === "success") {
        if (data.data.payment_required === false || data.data.free_access) {
          console.log("[PAYMENT] Payment currently disabled from backend");
          setPaymentRequired(false);
          setHasPaid(true);
          Alert.alert("Access Open", "Payment is currently turned off.");
        } else if (data.data.already_paid) {
          console.log("[PAYMENT] Already paid - skipping");
          setHasPaid(true);
          Alert.alert("Access Granted", "You already have full access!");
        } else if (data.data.authorization_url) {
          console.log(
            "[PAYMENT] WebView opening:",
            data.data.authorization_url,
          );
          setPaymentReference(data.data.reference || null);
          setPaymentUrl(data.data.authorization_url);
          setShowPaymentWebView(true);
        }
      } else {
        Alert.alert("Error", data.message || "Failed to start payment");
      }
    } catch (err) {
      console.error("[PAYMENT] Start error:", err);
      Alert.alert("Error", "Could not connect to payment service");
    } finally {
      setPaymentLoading(false);
    }
  };

  const onWebViewNavigationStateChange = async (navState: any) => {
    const { url } = navState;

    console.log("[WEBVIEW] Navigated to:", url);

    if (url.includes("payment-success")) {
      console.log("[WEBVIEW] SUCCESS DETECTED");
      setShowPaymentWebView(false);

      const userStr = await SecureStore.getItemAsync("user");
      const user = JSON.parse(userStr || "{}");

      let verified = false;

      if (paymentReference && user?.id) {
        verified = await verifyPayment(paymentReference, user.id);
      }

      if (!verified) {
        console.log(
          "[PAYMENT] Verify endpoint did not confirm yet, checking normal status...",
        );

        let paid = await checkPaymentStatus(1);

        if (!paid) {
          await new Promise((r) => setTimeout(r, 3000));
          paid = await checkPaymentStatus(2);
        }

        if (!paid) {
          await new Promise((r) => setTimeout(r, 5000));
          paid = await checkPaymentStatus(3);
        }

        verified = paid;
      }

      if (verified) {
        Alert.alert(
          "Payment Successful!",
          "Your ₦200 payment was completed and access has been activated.",
        );
        fetchQuizzes();
      } else {
        Alert.alert(
          "Almost there",
          "Payment seems successful, but access has not updated yet. Tap Refresh in a few seconds.",
        );
      }
    }

    if (url.includes("cancel") || url.includes("failed")) {
      console.log("[WEBVIEW] CANCEL/FAIL DETECTED");
      Alert.alert("Payment Cancelled", "You can try again later.");
      setShowPaymentWebView(false);
    }
  };

  const handleCloseWebView = async () => {
    console.log("[WEBVIEW] Closed by user");
    setShowPaymentWebView(false);

    const paid = await checkPaymentStatus();
    if (paid) {
      fetchQuizzes();
    }
  };

  if (hasPaid === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator
          size="large"
          color={C.purpleGlow}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  if (showPaymentWebView && paymentUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <View style={styles.webviewHeader}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleCloseWebView}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.webviewTitle}>Complete Payment</Text>
        </View>

        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={{ flex: 1 }}
          onNavigationStateChange={onWebViewNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={C.purpleGlow} />
              <Text style={styles.loadingText}>
                Loading Paystack Checkout...
              </Text>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  if (paymentRequired && !hasPaid) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <View style={styles.paywall}>
          <Text style={styles.paywallTitle}>Unlock Full Access</Text>

          <Text style={styles.paywallText}>
            Pay a one-time fee of ₦200 to access all quizzes, handouts,
            summaries, and premium features.
          </Text>

          <TouchableOpacity
            style={[styles.payBtn, paymentLoading && styles.payBtnDisabled]}
            onPress={startPayment}
            disabled={paymentLoading}
          >
            {paymentLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payBtnText}>Pay ₦200</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.paywallNote}>
            One-time payment • Instant access • Powered by Paystack
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={styles.header}>
        <Text style={styles.subtitle}>UNIMAID Resources</Text>
        <Text style={styles.title}>Quizzes</Text>

        <View style={styles.searchWrapper}>
          <View style={styles.iconBox}>
            <SearchIcon />
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
              <View style={styles.accentBar} />

              <View style={styles.cardInner}>
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

                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>

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

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  loader: { marginTop: 120 },

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
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.white,
    lineHeight: 21,
  },
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

  paywall: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  paywallTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: C.white,
    marginBottom: 16,
    textAlign: "center",
  },
  paywallText: {
    fontSize: 16,
    color: C.faint,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  payBtn: {
    backgroundColor: C.purpleMid,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginBottom: 16,
    width: "80%",
    alignItems: "center",
  },
  payBtnDisabled: {
    opacity: 0.6,
  },
  payBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  paywallNote: {
    fontSize: 13,
    color: C.faint,
    textAlign: "center",
  },

  refreshBtn: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.purpleGlow,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginBottom: 24,
  },
  refreshText: {
    color: C.purpleGlow,
    fontSize: 16,
    fontWeight: "700",
  },

  webviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  closeBtn: {
    padding: 10,
  },
  closeText: {
    color: C.purpleGlow,
    fontSize: 16,
    fontWeight: "700",
  },
  webviewTitle: {
    flex: 1,
    textAlign: "center",
    color: C.white,
    fontSize: 18,
    fontWeight: "700",
  },
  webviewLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.bg,
  },
  loadingText: {
    color: C.white,
    marginTop: 16,
    fontSize: 16,
  },
});
