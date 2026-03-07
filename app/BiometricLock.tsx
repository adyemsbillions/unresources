/*
File: BiometricLock.tsx
Purpose: Unlock app with fingerprint / biometrics
*/

import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

export default function BiometricLock({ navigation }: any) {
  useEffect(() => {
    authenticate();
  }, []);

  const authenticate = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Unimaid Resources",
      fallbackLabel: "Use device PIN",
    });

    if (result.success) {
      navigation.replace("Home");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Waiting for fingerprint...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    fontSize: 18,
  },
});
