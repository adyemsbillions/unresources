import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type AuthMode = "login" | "signup";

export default function Login() {
  const navigation = useNavigation<any>();

  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const apiUrl = "https://unresources.cravii.ng/api/login.php";

  const handleAuth = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Username and password are required");
      return;
    }

    if (mode === "signup" && !email.trim()) {
      Alert.alert("Error", "Email is required for signup");
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
      console.log("Raw server response:", text);

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        Alert.alert("Error", "Server sent invalid JSON response");
        return;
      }

      if (data.status === "success") {
        if (mode === "login") {
          navigation.navigate("Home", { user: data.user });
        } else {
          Alert.alert("Success", "Account created successfully. Please login.");
          setMode("login");
          setEmail("");
          setUsername("");
          setPassword("");
        }
      } else {
        Alert.alert("Failed", data.message || "Authentication failed");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      Alert.alert("Network Error", "Cannot reach server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unimaid Resources</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, mode === "login" && styles.active]}
          onPress={() => setMode("login")}
        >
          <Text
            style={[styles.toggleText, mode === "login" && styles.activeText]}
          >
            Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, mode === "signup" && styles.active]}
          onPress={() => setMode("signup")}
        >
          <Text
            style={[styles.toggleText, mode === "signup" && styles.activeText]}
          >
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>

      {mode === "signup" && (
        <TextInput
          placeholder="Email"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      )}

      <TextInput
        placeholder="Username"
        style={styles.input}
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {mode === "login" ? "Login" : "Sign Up"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setMode(mode === "login" ? "signup" : "login")}
      >
        <Text style={styles.switchText}>
          {mode === "login"
            ? "Don't have account? Sign Up"
            : "Already have account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
    color: "#333",
  },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: 24,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  active: {
    backgroundColor: "#0066cc",
  },
  toggleText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  activeText: {
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#fafafa",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#0066cc",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#88aaff",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  switchText: {
    marginTop: 24,
    textAlign: "center",
    color: "#0066cc",
    fontSize: 15,
  },
});
