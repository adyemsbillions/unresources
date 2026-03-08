/*
File: app/index.tsx

Purpose:
Startup screen for Unimaid Resources app.

Responsibilities:
1. Show welcome screen
2. Check if user is logged in
3. Check if biometric lock is enabled
4. Ask for fingerprint if enabled
5. Redirect user to correct screen

Flow:
- No user -> go to /login
- User + biometric enabled -> fingerprint
- User + biometric disabled -> go to /home
*/

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startApp();
  }, []);

  const startApp = async () => {
    try {
      // get stored user session
      const user = await AsyncStorage.getItem("user");

      // check biometric preference
      const biometricEnabled = await AsyncStorage.getItem("biometric_enabled");

      // if no user -> login
      if (!user) {
        router.replace("/login");
        return;
      }

      // if biometric enabled -> authenticate
      if (biometricEnabled === "yes") {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Unlock Unimaid Resources",
            fallbackLabel: "Use device passcode",
          });

          if (result.success) {
            router.replace("/home");
            return;
          } else {
            router.replace("/login");
            return;
          }
        } else {
          // device does not support biometrics
          router.replace("/home");
          return;
        }
      }

      // biometric disabled
      router.replace("/home");
    } catch (error) {
      console.log("Startup error:", error);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unimaid Resources</Text>

      <Text style={styles.subtitle}>Students • Knowledge • Opportunities</Text>

      <ActivityIndicator
        size="large"
        color="#0066cc"
        style={{ marginTop: 20 }}
      />

      <Text style={styles.loadingText}>
        Preparing your campus experience...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0066cc",
  },

  subtitle: {
    fontSize: 14,
    marginTop: 8,
    color: "#555",
  },

  loadingText: {
    marginTop: 15,
    fontSize: 12,
    color: "#777",
  },
});
