/*
File: Announcements.tsx
Purpose: Display announcements
*/

import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function Announcements() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://unresources.cravii.ng/api/announcements.php")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: any) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>{item.content}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },

  title: {
    fontWeight: "bold",
    marginBottom: 5,
  },
});
