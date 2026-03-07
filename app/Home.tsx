/*
File: Home.tsx
Purpose: Main dashboard
*/

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function Home({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unimaid Resources</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("Announcements")}
      >
        <Text>Announcements</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("ChatList")}
      >
        <Text>Chats</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("Marketplace")}
      >
        <Text>Marketplace</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#f2f2f2",
    padding: 20,
    marginBottom: 15,
    borderRadius: 8,
  },
});
