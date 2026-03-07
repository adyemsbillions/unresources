/*
File: Login.tsx
Purpose: Login screen
Includes small styling
*/

import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function Login({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const form = new FormData();

    form.append("username", username);
    form.append("password", password);

    const res = await fetch("http://unresources.cravii.ng/api/login.php", {
      method: "POST",
      body: form,
    });

    const data = await res.json();

    if (data.status == "success") {
      navigation.navigate("Home", { user: data.user });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unimaid Resources</Text>

      <TextInput
        placeholder="Username"
        style={styles.input}
        onChangeText={setUsername}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={login}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 6,
  },

  button: {
    backgroundColor: "#0066cc",
    padding: 15,
    borderRadius: 6,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
  },
});
