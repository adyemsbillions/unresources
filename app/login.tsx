import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type AuthMode = "login" | "signup";

export default function Login() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const apiUrl = "https://unresources.cravii.ng/api/login.php";

  const handleAuth = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Username and password are required.");
      return;
    }

    if (mode === "signup" && !email.trim()) {
      Alert.alert("Missing Fields", "Email is required for sign up.");
      return;
    }

    setLoading(true);

    try {
      let body = `action=${encodeURIComponent(mode)}`;
      body += `&username=${encodeURIComponent(username.trim())}`;
      body += `&password=${encodeURIComponent(password)}`;

      if (mode === "signup") {
        body += `&email=${encodeURIComponent(email.trim())}`;
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body,
      });

      const text = await response.text();
      console.log("LOGIN RAW RESPONSE:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        Alert.alert("Server Error", "Invalid response from server.");
        console.error("Parse failed:", text);
        return;
      }

      if (data.status === "success") {
        if (mode === "login") {
          const user = data.user;

          if (!user || !user.id) {
            Alert.alert(
              "Login Error",
              "User data missing from server response.",
            );
            return;
          }

          await SecureStore.setItemAsync("user", JSON.stringify(user));
          await SecureStore.setItemAsync("user_id", String(user.id));
          await SecureStore.setItemAsync(
            "username",
            String(user.username ?? ""),
          );

          console.log("Saved user:", user);
          console.log("Saved user_id:", String(user.id));

          router.replace("/Home");
        } else {
          Alert.alert("Success", "Account created! Please log in.");
          setMode("login");
          setEmail("");
          setUsername("");
          setPassword("");
        }
      } else {
        Alert.alert("Failed", data.message || "Authentication failed.");
      }
    } catch (err) {
      Alert.alert(
        "Network Error",
        "Cannot reach the server. Check your connection.",
      );
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  const focused = (name: string) => focusedField === name;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.pill}>
            <View style={styles.pillDot} />
            <Text style={styles.pillText}>UNIMAID RESOURCES</Text>
          </View>

          <Text style={styles.heading}>
            {"Welcome\n"}
            <Text style={styles.headingAccent}>Back.</Text>
          </Text>

          <Text style={styles.subheading}>
            Sign in to access your academic portal
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setMode("login")}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.tabText, mode === "login" && styles.tabTextOn]}
              >
                Login
              </Text>
              {mode === "login" && <View style={styles.tabUnderline} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tab}
              onPress={() => setMode("signup")}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.tabText, mode === "signup" && styles.tabTextOn]}
              >
                Sign Up
              </Text>
              {mode === "signup" && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          </View>

          <View
            style={mode === "signup" ? styles.fieldVisible : styles.fieldHidden}
          >
            <Text style={styles.label}>EMAIL</Text>
            <View
              style={[
                styles.inputRow,
                focused("email") && styles.inputRowFocused,
              ]}
            >
              <Text style={styles.inputIcon}>✉{"  "}</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#2E2E50"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
                onSubmitEditing={() => usernameRef.current?.focus()}
                editable={mode === "signup"}
              />
            </View>
          </View>

          <View style={styles.fieldVisible}>
            <Text style={styles.label}>USERNAME</Text>
            <View
              style={[
                styles.inputRow,
                focused("username") && styles.inputRowFocused,
              ]}
            >
              <Text style={styles.inputIcon}>@{"  "}</Text>
              <TextInput
                ref={usernameRef}
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#2E2E50"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
          </View>

          <View style={styles.fieldVisible}>
            <Text style={styles.label}>PASSWORD</Text>
            <View
              style={[
                styles.inputRow,
                focused("password") && styles.inputRowFocused,
              ]}
            >
              <Text style={styles.inputIcon}>⬡{"  "}</Text>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#2E2E50"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
                onSubmitEditing={handleAuth}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "login" ? "Enter Portal →" : "Create Account →"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setMode(mode === "login" ? "signup" : "login")}
          activeOpacity={0.7}
        >
          <Text style={styles.switchText}>
            {mode === "login" ? "No account yet?  " : "Already registered?  "}
            <Text style={styles.switchLink}>
              {mode === "login" ? "Sign Up" : "Login"}
            </Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerTag}>
          University of Maiduguri · Resources
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const C = {
  bg: "#08080F",
  card: "#0F0F1C",
  border: "#1C1C30",
  inputBg: "#070710",
  purple: "#7C3AED",
  purpleLight: "#A78BFA",
  white: "#FFFFFF",
  offWhite: "#E5E5F0",
  muted: "#4B4B6B",
  mutedDark: "#2E2E50",
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    marginBottom: 28,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(109,40,217,0.15)",
    borderWidth: 1,
    borderColor: "rgba(109,40,217,0.4)",
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginBottom: 18,
    gap: 7,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.purpleLight,
  },
  pillText: {
    fontSize: 10,
    letterSpacing: 2.5,
    color: C.purpleLight,
    fontWeight: "600",
  },
  heading: {
    fontSize: 38,
    fontWeight: "900",
    color: C.white,
    letterSpacing: -1,
    lineHeight: 46,
    marginBottom: 8,
  },
  headingAccent: {
    color: C.purple,
  },
  subheading: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "400",
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 22,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 12,
    position: "relative",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.muted,
  },
  tabTextOn: {
    color: C.purpleLight,
  },
  tabUnderline: {
    position: "absolute",
    bottom: -1,
    left: "20%",
    right: "20%",
    height: 2,
    backgroundColor: C.purple,
    borderRadius: 2,
  },
  fieldVisible: {
    marginBottom: 14,
  },
  fieldHidden: {
    height: 0,
    overflow: "hidden",
    opacity: 0,
    marginBottom: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: C.muted,
    marginBottom: 7,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    height: 50,
    paddingHorizontal: 14,
  },
  inputRowFocused: {
    borderColor: C.purple,
  },
  inputIcon: {
    fontSize: 13,
    color: C.muted,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: C.offWhite,
    fontWeight: "400",
    paddingVertical: 0,
  },
  button: {
    backgroundColor: C.purple,
    height: 52,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: C.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  switchText: {
    textAlign: "center",
    fontSize: 13,
    color: C.muted,
  },
  switchLink: {
    color: C.purpleLight,
    fontWeight: "700",
  },
  footerTag: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 10,
    letterSpacing: 2,
    color: C.mutedDark,
    textTransform: "uppercase",
  },
});
